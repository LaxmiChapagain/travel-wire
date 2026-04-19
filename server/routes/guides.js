const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('./auth');

const router = express.Router();

// Return the current guide's profile. If no row exists yet, return an empty
// profile with user fields filled in so the frontend can render the form.
router.get('/me', requireAuth, requireRole('guide'), async (req, res) => {
    try {
        const [rows] = await pool.promise().query(
            `SELECT u.id AS user_id, u.name, u.email,
                    gp.bio, gp.languages, gp.location, gp.specialties,
                    gp.hourly_rate, gp.phone, gp.updated_at
             FROM users u
             LEFT JOIN guide_profiles gp ON gp.user_id = u.id
             WHERE u.id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'user not found' });
        res.json({ profile: rows[0] });
    } catch (err) {
        console.error('guides/me GET error:', err);
        res.status(500).json({ error: 'failed to load profile' });
    }
});

// Upsert the current guide's profile.
router.put('/me', requireAuth, requireRole('guide'), async (req, res) => {
    try {
        const { bio, languages, location, specialties, hourly_rate, phone } = req.body || {};
        const rate = hourly_rate === '' || hourly_rate === null || hourly_rate === undefined
            ? null
            : Number(hourly_rate);
        if (rate !== null && (Number.isNaN(rate) || rate < 0)) {
            return res.status(400).json({ error: 'hourly_rate must be a non-negative number' });
        }

        await pool.promise().query(
            `INSERT INTO guide_profiles (user_id, bio, languages, location, specialties, hourly_rate, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                bio = VALUES(bio),
                languages = VALUES(languages),
                location = VALUES(location),
                specialties = VALUES(specialties),
                hourly_rate = VALUES(hourly_rate),
                phone = VALUES(phone)`,
            [
                req.user.id,
                bio || null,
                languages || null,
                location || null,
                specialties || null,
                rate,
                phone || null,
            ]
        );

        const [rows] = await pool.promise().query(
            `SELECT u.id AS user_id, u.name, u.email,
                    gp.bio, gp.languages, gp.location, gp.specialties,
                    gp.hourly_rate, gp.phone, gp.updated_at
             FROM users u
             LEFT JOIN guide_profiles gp ON gp.user_id = u.id
             WHERE u.id = ?`,
            [req.user.id]
        );
        res.json({ profile: rows[0] });
    } catch (err) {
        console.error('guides/me PUT error:', err);
        res.status(500).json({ error: 'failed to save profile' });
    }
});

// Public: list all guides with aggregate rating for cards.
router.get('/', async (_req, res) => {
    try {
        const [rows] = await pool.promise().query(
            `SELECT u.id, u.name,
                    gp.bio, gp.languages, gp.location, gp.specialties, gp.hourly_rate,
                    COALESCE(gp.verified, FALSE) AS verified,
                    (SELECT ROUND(AVG(rating), 1) FROM guide_reviews gr WHERE gr.guide_id = u.id) AS avg_rating,
                    (SELECT COUNT(*) FROM guide_reviews gr WHERE gr.guide_id = u.id) AS review_count
             FROM users u
             LEFT JOIN guide_profiles gp ON gp.user_id = u.id
             WHERE u.role = 'guide'
             ORDER BY COALESCE(gp.verified, FALSE) DESC, u.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('guides list error:', err);
        res.status(500).json({ error: 'failed to load guides' });
    }
});

// Public: single guide's full profile + their reviews.
router.get('/:id', async (req, res) => {
    try {
        const [guideRows] = await pool.promise().query(
            `SELECT u.id, u.name, u.email, u.created_at,
                    gp.bio, gp.languages, gp.location, gp.specialties, gp.hourly_rate, gp.phone,
                    COALESCE(gp.verified, FALSE) AS verified,
                    (SELECT ROUND(AVG(rating), 1) FROM guide_reviews gr WHERE gr.guide_id = u.id) AS avg_rating,
                    (SELECT COUNT(*) FROM guide_reviews gr WHERE gr.guide_id = u.id) AS review_count
             FROM users u
             LEFT JOIN guide_profiles gp ON gp.user_id = u.id
             WHERE u.id = ? AND u.role = 'guide'`,
            [req.params.id]
        );
        if (guideRows.length === 0) return res.status(404).json({ error: 'guide not found' });

        const [reviews] = await pool.promise().query(
            `SELECT gr.id, gr.rating, gr.comment, gr.created_at,
                    u.id AS tourist_id, u.name AS tourist_name
             FROM guide_reviews gr
             JOIN users u ON u.id = gr.tourist_id
             WHERE gr.guide_id = ?
             ORDER BY gr.created_at DESC`,
            [req.params.id]
        );
        // Don't expose email/phone to the general public — only to authenticated users.
        const guide = guideRows[0];
        const hasAuth = req.headers.authorization;
        if (!hasAuth) {
            delete guide.email;
            delete guide.phone;
        }
        res.json({ guide, reviews });
    } catch (err) {
        console.error('guide detail error:', err);
        res.status(500).json({ error: 'failed to load guide' });
    }
});

// Post a review for a guide. Tourist only, one review per (guide, tourist).
router.post('/:id/reviews', requireAuth, requireRole('tourist'), async (req, res) => {
    const guideId = Number(req.params.id);
    const rating = Number(req.body?.rating);
    const comment = req.body?.comment ? String(req.body.comment).trim() : null;
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'rating must be an integer 1-5' });
    }
    try {
        const [guideCheck] = await pool.promise().query("SELECT id, role FROM users WHERE id = ?", [guideId]);
        if (guideCheck.length === 0 || guideCheck[0].role !== 'guide') {
            return res.status(404).json({ error: 'guide not found' });
        }
        if (guideId === req.user.id) {
            return res.status(400).json({ error: "you can't review yourself" });
        }
        const [existing] = await pool.promise().query(
            'SELECT id FROM guide_reviews WHERE guide_id = ? AND tourist_id = ?',
            [guideId, req.user.id]
        );
        if (existing.length > 0) {
            // Update existing review.
            await pool.promise().query(
                'UPDATE guide_reviews SET rating = ?, comment = ? WHERE id = ?',
                [rating, comment, existing[0].id]
            );
            return res.json({ ok: true, id: existing[0].id, updated: true });
        }
        const [ins] = await pool.promise().query(
            'INSERT INTO guide_reviews (guide_id, tourist_id, rating, comment) VALUES (?, ?, ?, ?)',
            [guideId, req.user.id, rating, comment]
        );
        res.status(201).json({ ok: true, id: ins.insertId, updated: false });
    } catch (err) {
        console.error('guide review error:', err);
        res.status(500).json({ error: 'failed to save review' });
    }
});

module.exports = router;
