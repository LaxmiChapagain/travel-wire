const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `place_${req.params.id}_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Upload image for a place: POST /api/places/:id/image
router.post('/places/:id/image', upload.single('image'), async (req, res) => {
  const placeId = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filename = req.file.filename;
  try {
    await pool.promise().query('UPDATE places SET image = ? WHERE id = ?', [filename, placeId]);
    const [rows] = await pool.promise().query('SELECT * FROM places WHERE id = ?', [placeId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
