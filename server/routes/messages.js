const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('./auth');

const router = express.Router();

function buildSummaryQuery(whereClause, selfColumn) {
    return `
        SELECT c.id AS conversation_id,
               c.tourist_id, c.guide_id, c.updated_at,
               u_other.id   AS other_id,
               u_other.name AS other_name,
               u_other.role AS other_role,
               gp.location  AS other_location,
               (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message,
               (SELECT sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_sender_id,
               (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message_at
        FROM conversations c
        JOIN users u_other ON u_other.id =
            CASE WHEN c.${selfColumn} = ? THEN (CASE WHEN c.tourist_id = ? THEN c.guide_id ELSE c.tourist_id END) ELSE NULL END
        LEFT JOIN guide_profiles gp ON gp.user_id = u_other.id
        ${whereClause}
        ORDER BY c.updated_at DESC
    `;
}

// GET /api/conversations — list current user's conversations.
router.get('/', requireAuth, async (req, res) => {
    try {
        const uid = req.user.id;
        const col = req.user.role === 'tourist' ? 'tourist_id' : 'guide_id';
        const sql = buildSummaryQuery(`WHERE c.${col} = ?`, col);
        const [rows] = await pool.promise().query(sql, [uid, uid, uid]);
        res.json(rows);
    } catch (err) {
        console.error('conversations list error:', err);
        res.status(500).json({ error: 'failed to load conversations' });
    }
});

// POST /api/conversations — tourist starts (or reuses) a conversation with a guide, sends first message.
// Body: { guide_id, body }
router.post('/', requireAuth, requireRole('tourist'), async (req, res) => {
    const { guide_id, body } = req.body || {};
    if (!guide_id || !body || !String(body).trim()) {
        return res.status(400).json({ error: 'guide_id and non-empty body required' });
    }
    try {
        const [guideCheck] = await pool.promise().query("SELECT id, role FROM users WHERE id = ?", [guide_id]);
        if (guideCheck.length === 0 || guideCheck[0].role !== 'guide') {
            return res.status(404).json({ error: 'guide not found' });
        }

        const [existing] = await pool.promise().query(
            'SELECT id FROM conversations WHERE tourist_id = ? AND guide_id = ?',
            [req.user.id, guide_id]
        );

        let conversationId;
        if (existing.length > 0) {
            conversationId = existing[0].id;
        } else {
            const [ins] = await pool.promise().query(
                'INSERT INTO conversations (tourist_id, guide_id) VALUES (?, ?)',
                [req.user.id, guide_id]
            );
            conversationId = ins.insertId;
        }

        await pool.promise().query(
            'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
            [conversationId, req.user.id, String(body).trim()]
        );
        // Touch updated_at on the conversation so it bubbles to top of inbox lists.
        await pool.promise().query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);

        res.status(201).json({ conversation_id: conversationId });
    } catch (err) {
        console.error('conversations create error:', err);
        res.status(500).json({ error: 'failed to start conversation' });
    }
});

// GET /api/conversations/:id — full thread (messages + other-party info). Participants only.
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const [convos] = await pool.promise().query(
            `SELECT c.*, t.name AS tourist_name, g.name AS guide_name,
                    gp.location AS guide_location, gp.bio AS guide_bio
             FROM conversations c
             JOIN users t ON t.id = c.tourist_id
             JOIN users g ON g.id = c.guide_id
             LEFT JOIN guide_profiles gp ON gp.user_id = g.id
             WHERE c.id = ?`,
            [req.params.id]
        );
        if (convos.length === 0) return res.status(404).json({ error: 'conversation not found' });
        const convo = convos[0];
        if (convo.tourist_id !== req.user.id && convo.guide_id !== req.user.id) {
            return res.status(403).json({ error: 'not a participant in this conversation' });
        }
        const [messages] = await pool.promise().query(
            'SELECT id, sender_id, body, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC',
            [req.params.id]
        );
        res.json({ conversation: convo, messages });
    } catch (err) {
        console.error('conversation detail error:', err);
        res.status(500).json({ error: 'failed to load conversation' });
    }
});

// POST /api/conversations/:id/messages — reply in an existing conversation. Either party.
router.post('/:id/messages', requireAuth, async (req, res) => {
    const { body } = req.body || {};
    if (!body || !String(body).trim()) return res.status(400).json({ error: 'body required' });
    try {
        const [convos] = await pool.promise().query('SELECT tourist_id, guide_id FROM conversations WHERE id = ?', [req.params.id]);
        if (convos.length === 0) return res.status(404).json({ error: 'conversation not found' });
        const convo = convos[0];
        if (convo.tourist_id !== req.user.id && convo.guide_id !== req.user.id) {
            return res.status(403).json({ error: 'not a participant' });
        }
        const [ins] = await pool.promise().query(
            'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
            [req.params.id, req.user.id, String(body).trim()]
        );
        await pool.promise().query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
        const [rows] = await pool.promise().query(
            'SELECT id, sender_id, body, created_at FROM messages WHERE id = ?',
            [ins.insertId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('message post error:', err);
        res.status(500).json({ error: 'failed to send message' });
    }
});

module.exports = router;
