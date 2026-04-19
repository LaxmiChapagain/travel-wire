const express = require('express');
const router = express.Router();
const pool = require('../db');

// List all countries with place count and avg rating
router.get('/', async (req, res) => {
    try {
        const sql = `SELECT c.*, 
                   COUNT(p.id) as place_count,
                   ROUND(AVG(sub.avg_rating), 2) as overall_rating
                 FROM countries c
                 LEFT JOIN places p ON p.country_code = c.code
                 LEFT JOIN (
                   SELECT p2.id, AVG(r.rating) as avg_rating
                   FROM places p2
                   LEFT JOIN reviews r ON r.place_id = p2.id
                   GROUP BY p2.id
                 ) sub ON sub.id = p.id
                 GROUP BY c.code
                 ORDER BY c.name`;
        const [rows] = await pool.promise().query(sql);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get single country with its places
router.get('/:code', async (req, res) => {
    const code = req.params.code.toUpperCase();
    try {
        // Get country info
        const [countries] = await pool.promise().query('SELECT * FROM countries WHERE code = ?', [code]);
        if (!countries.length) return res.status(404).json({ error: 'Country not found' });

        // Get places in this country with ratings
        const placesSql = `SELECT p.*, ROUND(AVG(r.rating),2) as avg_rating, COUNT(r.id) as review_count
                       FROM places p
                       LEFT JOIN reviews r ON r.place_id = p.id
                       WHERE p.country_code = ?
                       GROUP BY p.id
                       ORDER BY avg_rating DESC, p.name`;
        const [places] = await pool.promise().query(placesSql, [code]);

        res.json({ ...countries[0], places });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
