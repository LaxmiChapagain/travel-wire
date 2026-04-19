const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT DISTINCT category FROM places WHERE category IS NOT NULL');
    res.json(rows.map(r => r.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
