const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('./auth');

const router = express.Router();

// Every route here is admin-only.
router.use(requireAuth, requireRole('admin'));

const ALLOWED_ROLES = ['tourist', 'guide', 'admin'];

// Overview: stats for the dashboard.
router.get('/stats', async (_req, res) => {
    try {
        const p = pool.promise();
        const [
            [[tourists]], [[guides]], [[admins]],
            [[places]], [[reviews]], [[convos]], [[messages]], [[verified]],
            [recentUsers],
        ] = await Promise.all([
            p.query("SELECT COUNT(*) AS c FROM users WHERE role = 'tourist'"),
            p.query("SELECT COUNT(*) AS c FROM users WHERE role = 'guide'"),
            p.query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'"),
            p.query('SELECT COUNT(*) AS c FROM places'),
            p.query('SELECT COUNT(*) AS c FROM reviews'),
            p.query('SELECT COUNT(*) AS c FROM conversations'),
            p.query('SELECT COUNT(*) AS c FROM messages'),
            p.query('SELECT COUNT(*) AS c FROM guide_profiles WHERE verified = TRUE'),
            p.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 6'),
        ]);
        res.json({
            tourists: tourists.c,
            guides: guides.c,
            admins: admins.c,
            places: places.c,
            reviews: reviews.c,
            conversations: convos.c,
            messages: messages.c,
            verified_guides: verified.c,
            recent_users: recentUsers,
        });
    } catch (err) {
        console.error('admin stats error:', err);
        res.status(500).json({ error: 'failed to load stats' });
    }
});

// Users list with optional filters.
router.get('/users', async (req, res) => {
    try {
        const { q, role } = req.query;
        const where = [];
        const args = [];
        if (role && ALLOWED_ROLES.includes(role)) {
            where.push('u.role = ?');
            args.push(role);
        }
        if (q) {
            where.push('(u.name LIKE ? OR u.email LIKE ?)');
            args.push(`%${q}%`, `%${q}%`);
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const [rows] = await pool.promise().query(
            `SELECT u.id, u.name, u.email, u.role, u.created_at,
                    gp.verified AS guide_verified
             FROM users u
             LEFT JOIN guide_profiles gp ON gp.user_id = u.id
             ${whereSql}
             ORDER BY u.created_at DESC
             LIMIT 500`,
            args
        );
        res.json(rows);
    } catch (err) {
        console.error('admin users error:', err);
        res.status(500).json({ error: 'failed to load users' });
    }
});

// Change a user's role.
router.put('/users/:id/role', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { role } = req.body || {};
        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ error: `role must be one of: ${ALLOWED_ROLES.join(', ')}` });
        }
        if (id === req.user.id && role !== 'admin') {
            return res.status(400).json({ error: "you can't demote yourself" });
        }
        const [result] = await pool.promise().query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'user not found' });
        res.json({ ok: true });
    } catch (err) {
        console.error('admin role update error:', err);
        res.status(500).json({ error: 'failed to update role' });
    }
});

// Delete a user (cascades: profile, convos, messages via FK).
router.delete('/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (id === req.user.id) {
            return res.status(400).json({ error: "you can't delete your own admin account" });
        }
        const [result] = await pool.promise().query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'user not found' });
        res.json({ ok: true });
    } catch (err) {
        console.error('admin delete user error:', err);
        res.status(500).json({ error: 'failed to delete user' });
    }
});

// Toggle verified flag on a guide.
router.put('/guides/:id/verify', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { verified } = req.body || {};
        if (typeof verified !== 'boolean') {
            return res.status(400).json({ error: 'verified must be boolean' });
        }
        const [user] = await pool.promise().query("SELECT role FROM users WHERE id = ?", [id]);
        if (user.length === 0 || user[0].role !== 'guide') {
            return res.status(404).json({ error: 'guide not found' });
        }
        // Ensure a profile row exists so we have something to set verified on.
        await pool.promise().query(
            `INSERT INTO guide_profiles (user_id, verified) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE verified = VALUES(verified)`,
            [id, verified]
        );
        res.json({ ok: true, verified });
    } catch (err) {
        console.error('admin verify error:', err);
        res.status(500).json({ error: 'failed to update verification' });
    }
});

// All reviews with place + author info for moderation.
router.get('/reviews', async (_req, res) => {
    try {
        const [rows] = await pool.promise().query(
            `SELECT r.id, r.rating, r.author, r.comment, r.created_at,
                    p.id AS place_id, p.name AS place_name, p.country
             FROM reviews r
             JOIN places p ON p.id = r.place_id
             ORDER BY r.created_at DESC
             LIMIT 300`
        );
        res.json(rows);
    } catch (err) {
        console.error('admin reviews error:', err);
        res.status(500).json({ error: 'failed to load reviews' });
    }
});

router.delete('/reviews/:id', async (req, res) => {
    try {
        const [result] = await pool.promise().query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'review not found' });
        res.json({ ok: true });
    } catch (err) {
        console.error('admin delete review error:', err);
        res.status(500).json({ error: 'failed to delete review' });
    }
});

// Recent conversations for moderation (read-only).
router.get('/conversations', async (_req, res) => {
    try {
        const [rows] = await pool.promise().query(
            `SELECT c.id, c.updated_at,
                    t.name AS tourist_name, t.email AS tourist_email,
                    g.name AS guide_name, g.email AS guide_email,
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
                    (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message
             FROM conversations c
             JOIN users t ON t.id = c.tourist_id
             JOIN users g ON g.id = c.guide_id
             ORDER BY c.updated_at DESC
             LIMIT 100`
        );
        res.json(rows);
    } catch (err) {
        console.error('admin convos error:', err);
        res.status(500).json({ error: 'failed to load conversations' });
    }
});

module.exports = router;
