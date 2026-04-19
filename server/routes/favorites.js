const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('./auth');

const router = express.Router();

// GET /api/favorites — list the current tourist's favorited places (full place data + review stats).
router.get('/', requireAuth, requireRole('tourist'), async (req, res) => {
    try {
        const [rows] = await pool.promise().query(
            `SELECT p.id, p.name, p.description, p.city, p.country, p.country_code,
                    p.lat, p.lng, p.category, p.image, p.highlights,
                    f.created_at AS favorited_at,
                    (SELECT AVG(rating) FROM reviews r WHERE r.place_id = p.id) AS avg_rating,
                    (SELECT COUNT(*) FROM reviews r WHERE r.place_id = p.id) AS review_count
             FROM favorites f
             JOIN places p ON p.id = f.place_id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('favorites list error:', err);
        res.status(500).json({ error: 'failed to load favorites' });
    }
});

// GET /api/favorites/ids — just the set of place ids the current tourist has favorited.
// Lightweight endpoint used by the frontend to decide which heart icons should be filled.
router.get('/ids', requireAuth, requireRole('tourist'), async (req, res) => {
    try {
        const [rows] = await pool.promise().query(
            'SELECT place_id FROM favorites WHERE user_id = ?',
            [req.user.id]
        );
        res.json(rows.map((r) => r.place_id));
    } catch (err) {
        console.error('favorites ids error:', err);
        res.status(500).json({ error: 'failed to load favorite ids' });
    }
});

// POST /api/favorites — add a favorite. Body: { place_id }. Idempotent.
router.post('/', requireAuth, requireRole('tourist'), async (req, res) => {
    const placeId = Number(req.body?.place_id);
    if (!placeId) return res.status(400).json({ error: 'place_id required' });
    try {
        const [placeCheck] = await pool.promise().query('SELECT id FROM places WHERE id = ?', [placeId]);
        if (placeCheck.length === 0) return res.status(404).json({ error: 'place not found' });

        await pool.promise().query(
            `INSERT INTO favorites (user_id, place_id) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE user_id = user_id`,
            [req.user.id, placeId]
        );
        res.status(201).json({ ok: true, place_id: placeId });
    } catch (err) {
        console.error('favorites add error:', err);
        res.status(500).json({ error: 'failed to add favorite' });
    }
});

// DELETE /api/favorites/:placeId
router.delete('/:placeId', requireAuth, requireRole('tourist'), async (req, res) => {
    try {
        const [result] = await pool.promise().query(
            'DELETE FROM favorites WHERE user_id = ? AND place_id = ?',
            [req.user.id, req.params.placeId]
        );
        res.json({ ok: true, removed: result.affectedRows });
    } catch (err) {
        console.error('favorites delete error:', err);
        res.status(500).json({ error: 'failed to remove favorite' });
    }
});

module.exports = router;
