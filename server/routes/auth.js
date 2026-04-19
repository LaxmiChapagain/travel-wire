const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-change-me';
const JWT_EXPIRES_IN = '7d';

function signToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function publicUser(u) {
    return { id: u.id, name: u.name, email: u.email, created_at: u.created_at };
}

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'password must be at least 6 characters' });
        }
        const normEmail = String(email).trim().toLowerCase();

        const [existing] = await pool.promise().query('SELECT id FROM users WHERE email = ?', [normEmail]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'email is already registered' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.promise().query(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [String(name).trim(), normEmail, hash]
        );
        const [rows] = await pool.promise().query('SELECT id, name, email, created_at FROM users WHERE id = ?', [result.insertId]);
        const user = rows[0];
        const token = signToken(user);
        res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
        console.error('register error:', err);
        res.status(500).json({ error: 'registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }
        const normEmail = String(email).trim().toLowerCase();
        const [rows] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [normEmail]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'invalid email or password' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'invalid email or password' });
        }
        const token = signToken(user);
        res.json({ token, user: publicUser(user) });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ error: 'login failed' });
    }
});

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing token' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'invalid or expired token' });
    }
}

router.get('/me', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.promise().query(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'user not found' });
        res.json({ user: rows[0] });
    } catch (err) {
        console.error('me error:', err);
        res.status(500).json({ error: 'failed to load user' });
    }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
