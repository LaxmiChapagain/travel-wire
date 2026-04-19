require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const placesRouter = require('./routes/places');
const reviewsRouter = require('./routes/reviews');
const categoriesRouter = require('./routes/categories');
const uploadsRouter = require('./routes/uploads');
const countriesRouter = require('./routes/countries');
const authRouter = require('./routes/auth');
const guidesRouter = require('./routes/guides');
const conversationsRouter = require('./routes/messages');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Ensure uploads directory exists and serve it
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/places', placesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/countries', countriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api', uploadsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Database connection test endpoint
const pool = require('./db');
app.get('/api/db-test', async (req, res) => {
	try {
		const [rows] = await pool.promise().query('SELECT COUNT(*) as count FROM places');
		const [reviewRows] = await pool.promise().query('SELECT COUNT(*) as count FROM reviews');
		res.json({
			ok: true,
			message: 'Database connected successfully!',
			places_count: rows[0].count,
			reviews_count: reviewRows[0].count
		});
	} catch (err) {
		console.error('DB test error:', err);
		res.status(500).json({
			ok: false,
			error: err.message,
			hint: 'Make sure MAMP MySQL is running and the travel_guide database exists with schema imported.'
		});
	}
});

// Serve client build in production (if you build the React app)
if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
	});
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
