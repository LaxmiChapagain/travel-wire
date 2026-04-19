const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get reviews for a place
router.get('/place/:placeId', async (req, res) => {
  const placeId = req.params.placeId;
  try {
    const [rows] = await pool.promise().query('SELECT * FROM reviews WHERE place_id = ? ORDER BY created_at DESC', [placeId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add a review (no auth for now)
router.post('/', async (req, res) => {
  const { place_id, author = 'Anonymous', rating, comment } = req.body;
  if (!place_id || !rating) return res.status(400).json({ error: 'place_id and rating required' });
  try {
    const [result] = await pool.promise().query(
      'INSERT INTO reviews (place_id, author, rating, comment) VALUES (?, ?, ?, ?)',
      [place_id, author, rating, comment]
    );
    const [rows] = await pool.promise().query('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
