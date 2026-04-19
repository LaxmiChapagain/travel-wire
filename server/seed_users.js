// One-off seed script to populate tourists + guides with deterministic credentials.
// Run from the server dir:  node seed_users.js
// Password for every seeded account: password123
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const PASSWORD = 'password123';

const TOURISTS = [
    { name: 'Maya Singh', email: 'maya@example.com' },
    { name: 'John Smith', email: 'john@example.com' },
    { name: 'Elena Rossi', email: 'elena@example.com' },
    { name: 'Aarav Patel', email: 'aarav@example.com' },
    { name: 'Sophie Chen', email: 'sophie@example.com' },
];

const GUIDES = [
    {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        profile: {
            bio: '12 years guiding treks in the Himalayas. Certified by Nepal Mountaineering Association.',
            languages: 'English, Nepali, Hindi',
            location: 'Kathmandu, Nepal',
            specialties: 'Trekking, Cultural tours, Temple visits',
            hourly_rate: 25,
            phone: '+977-98-1234-5678',
        },
    },
    {
        name: 'Keshav Bhattarai',
        email: 'keshav@example.com',
        profile: {
            bio: 'Pokhara local. I run lake tours, paragliding intros, and the Annapurna foothills.',
            languages: 'English, Nepali',
            location: 'Pokhara, Nepal',
            specialties: 'Adventure, Paragliding, Lake tours',
            hourly_rate: 20,
            phone: '+977-98-7654-3210',
        },
    },
    {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        profile: {
            bio: 'NYC native, 8 years showing visitors around the five boroughs. Food and history focus.',
            languages: 'English, Spanish',
            location: 'New York City, USA',
            specialties: 'Food tours, History, Architecture',
            hourly_rate: 60,
            phone: '+1-212-555-0142',
        },
    },
    {
        name: 'Ethan Williams',
        email: 'ethan@example.com',
        profile: {
            bio: 'Based in San Francisco. Golden Gate bike tours, Muir Woods day trips, tech history walks.',
            languages: 'English',
            location: 'San Francisco, USA',
            specialties: 'Cycling, Nature, Tech history',
            hourly_rate: 55,
            phone: '+1-415-555-0198',
        },
    },
    {
        name: 'Marie Dubois',
        email: 'marie@example.com',
        profile: {
            bio: 'Parisienne and licensed guide. Skip-the-line Louvre tours, hidden Montmartre, wine tastings.',
            languages: 'French, English, Italian',
            location: 'Paris, France',
            specialties: 'Museums, Wine, Hidden Paris',
            hourly_rate: 70,
            phone: '+33-6-12-34-56-78',
        },
    },
];

async function upsertUser({ name, email, role }) {
    const [existing] = await pool.promise().query('SELECT id FROM users WHERE email = ?', [email]);
    const hash = await bcrypt.hash(PASSWORD, 10);
    if (existing.length > 0) {
        await pool.promise().query(
            'UPDATE users SET name=?, password_hash=?, role=? WHERE email=?',
            [name, hash, role, email]
        );
        return existing[0].id;
    }
    const [res] = await pool.promise().query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, role]
    );
    return res.insertId;
}

async function upsertGuideProfile(userId, p) {
    await pool.promise().query(
        `INSERT INTO guide_profiles (user_id, bio, languages, location, specialties, hourly_rate, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            bio=VALUES(bio), languages=VALUES(languages), location=VALUES(location),
            specialties=VALUES(specialties), hourly_rate=VALUES(hourly_rate), phone=VALUES(phone)`,
        [userId, p.bio, p.languages, p.location, p.specialties, p.hourly_rate, p.phone]
    );
}

(async () => {
    try {
        console.log('Seeding tourists…');
        for (const t of TOURISTS) {
            const id = await upsertUser({ ...t, role: 'tourist' });
            console.log(`  ✓ tourist ${t.email} → id ${id}`);
        }
        console.log('Seeding guides…');
        for (const g of GUIDES) {
            const id = await upsertUser({ name: g.name, email: g.email, role: 'guide' });
            await upsertGuideProfile(id, g.profile);
            console.log(`  ✓ guide ${g.email} → id ${id}`);
        }
        console.log('\nAll seeded accounts use password: password123');
        await pool.promise().end();
    } catch (err) {
        console.error('seed error:', err);
        process.exit(1);
    }
})();
