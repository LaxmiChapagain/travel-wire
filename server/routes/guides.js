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

// Public: list all guides (for future "browse guides" page / contact feature).
router.get('/', async (_req, res) => {
    try {
        const [rows] = await pool.promise().query(
            `SELECT u.id, u.name,
                    gp.bio, gp.languages, gp.location, gp.specialties, gp.hourly_rate
             FROM users u
             LEFT JOIN guide_profiles gp ON gp.user_id = u.id
             WHERE u.role = 'guide'
             ORDER BY u.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('guides list error:', err);
        res.status(500).json({ error: 'failed to load guides' });
    }
});

module.exports = router;
