const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('./auth');

const router = express.Router();

const VALID_STATUSES = ['pending', 'accepted', 'declined', 'completed', 'cancelled'];

// Allowed status transitions, keyed by (currentStatus, role).
// 'self' in values means "whoever is making the request".
const TRANSITIONS = {
    tourist: {
        pending:  ['cancelled'],
        accepted: ['cancelled'],
        declined: [],
        completed: [],
        cancelled: [],
    },
    guide: {
        pending:  ['accepted', 'declined'],
        accepted: ['completed', 'cancelled'],
        declined: [],
        completed: [],
        cancelled: [],
    },
};

// POST /api/bookings — tourist creates a booking request.
// Body: { guide_id, booking_date (YYYY-MM-DD), hours, notes }
router.post('/', requireAuth, requireRole('tourist'), async (req, res) => {
    const { guide_id, booking_date, hours, notes } = req.body || {};
    const guideId = Number(guide_id);
    const hrs = Number(hours);
    if (!guideId || !booking_date || !hrs || hrs <= 0) {
        return res.status(400).json({ error: 'guide_id, booking_date, and positive hours are required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(booking_date))) {
        return res.status(400).json({ error: 'booking_date must be YYYY-MM-DD' });
    }
    try {
        const [guideCheck] = await pool.promise().query(
            `SELECT u.id, u.role, gp.hourly_rate
             FROM users u LEFT JOIN guide_profiles gp ON gp.user_id = u.id
             WHERE u.id = ?`,
            [guideId]
        );
        if (guideCheck.length === 0 || guideCheck[0].role !== 'guide') {
            return res.status(404).json({ error: 'guide not found' });
        }
        const rate = guideCheck[0].hourly_rate;
        const totalPrice = rate != null ? Number(rate) * hrs : null;

        const [ins] = await pool.promise().query(
            `INSERT INTO bookings (tourist_id, guide_id, booking_date, hours, notes, total_price, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [req.user.id, guideId, booking_date, hrs, notes || null, totalPrice]
        );
        res.status(201).json({ ok: true, id: ins.insertId });
    } catch (err) {
        console.error('booking create error:', err);
        res.status(500).json({ error: 'failed to create booking' });
    }
});

// GET /api/bookings — current user's bookings. As tourist: their outgoing. As guide: their incoming.
router.get('/', requireAuth, async (req, res) => {
    try {
        const isGuide = req.user.role === 'guide';
        const isTourist = req.user.role === 'tourist';
        if (!isGuide && !isTourist) {
            return res.status(403).json({ error: 'only tourists and guides have bookings' });
        }
        const col = isTourist ? 'tourist_id' : 'guide_id';
        const [rows] = await pool.promise().query(
            `SELECT b.id, b.booking_date, b.hours, b.notes, b.status, b.total_price,
                    b.created_at, b.updated_at,
                    b.tourist_id, b.guide_id,
                    t.name AS tourist_name, t.email AS tourist_email,
                    g.name AS guide_name, g.email AS guide_email,
                    gp.location AS guide_location, gp.hourly_rate, gp.phone AS guide_phone
             FROM bookings b
             JOIN users t ON t.id = b.tourist_id
             JOIN users g ON g.id = b.guide_id
             LEFT JOIN guide_profiles gp ON gp.user_id = g.id
             WHERE b.${col} = ?
             ORDER BY b.booking_date DESC, b.id DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('bookings list error:', err);
        res.status(500).json({ error: 'failed to load bookings' });
    }
});

// PUT /api/bookings/:id/status — accept/decline/cancel/complete based on role + current status.
router.put('/:id/status', requireAuth, async (req, res) => {
    const { status } = req.body || {};
    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    try {
        const [rows] = await pool.promise().query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'booking not found' });
        const booking = rows[0];
        const isTourist = req.user.role === 'tourist' && booking.tourist_id === req.user.id;
        const isGuide = req.user.role === 'guide' && booking.guide_id === req.user.id;
        if (!isTourist && !isGuide) {
            return res.status(403).json({ error: 'not a participant in this booking' });
        }
        const roleKey = isTourist ? 'tourist' : 'guide';
        const allowed = TRANSITIONS[roleKey][booking.status] || [];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                error: `cannot change status from "${booking.status}" to "${status}" as ${roleKey}`,
            });
        }
        await pool.promise().query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ ok: true, status });
    } catch (err) {
        console.error('booking status error:', err);
        res.status(500).json({ error: 'failed to update status' });
    }
});

module.exports = router;
