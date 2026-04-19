const express = require('express');
const router = express.Router();
const pool = require('../db');

// List places with optional search and category filters
router.get('/', async (req, res) => {
  const { q, category } = req.query;
  try {
    let sql = `SELECT p.*, ROUND(AVG(r.rating),2) as avg_rating, COUNT(r.id) as review_count
               FROM places p
               LEFT JOIN reviews r ON r.place_id = p.id`;
    const params = [];
    const where = [];
    if (q) {
      where.push(`(p.name LIKE ? OR p.city LIKE ? OR p.country LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (category) {
      where.push('p.category = ?');
      params.push(category);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT 200';

    const [rows] = await pool.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error - ensure schema is imported' });
  }
});

// Get place by id with aggregated rating
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const sql = `SELECT p.*, ROUND(AVG(r.rating),2) as avg_rating, COUNT(r.id) as review_count
                 FROM places p
                 LEFT JOIN reviews r ON r.place_id = p.id
                 WHERE p.id = ?
                 GROUP BY p.id`;
    const [rows] = await pool.promise().query(sql, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
