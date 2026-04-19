import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMPTY_PROFILE = {
    bio: '',
    languages: '',
    location: '',
    specialties: '',
    hourly_rate: '',
    phone: '',
};

export default function GuideDashboard() {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [bookings, setBookings] = useState([]);
    const [guideMeta, setGuideMeta] = useState(null); // avg_rating, review_count

    const authHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }), [token]);

    const loadBookings = useCallback(async () => {
        try {
            const res = await fetch('/api/bookings', { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setBookings(data);
        } catch { /* non-fatal for dashboard */ }
    }, [authHeaders]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await fetch('/api/guides/me', { headers: authHeaders() });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'failed to load');
                if (!cancelled) {
                    setProfile({
                        bio: data.profile.bio || '',
                        languages: data.profile.languages || '',
                        location: data.profile.location || '',
                        specialties: data.profile.specialties || '',
                        hourly_rate: data.profile.hourly_rate != null ? String(data.profile.hourly_rate) : '',
                        phone: data.profile.phone || '',
                    });
                }
                // Also fetch own public profile for aggregate rating/review count.
                if (user?.id) {
                    const metaRes = await fetch(`/api/guides/${user.id}`);
                    if (metaRes.ok) {
                        const metaData = await metaRes.json();
                        if (!cancelled) setGuideMeta(metaData.guide);
                    }
                }
                loadBookings();
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [authHeaders, user?.id, loadBookings]);

    const updateBooking = async (id, status) => {
        try {
            const res = await fetch(`/api/bookings/${id}/status`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ status }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
            loadBookings();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleChange = (field) => (e) => {
        setProfile((p) => ({ ...p, [field]: e.target.value }));
        setSaved(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const res = await fetch('/api/guides/me', {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(profile),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'save failed');
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="dashboard-loading">Loading your dashboard…</div>;
    }

    const isProfileComplete = profile.bio && profile.languages && profile.location;

    return (
        <div className="guide-dashboard">
            <header className="dashboard-header">
                <div>
                    <div className="dashboard-eyebrow">🧭 Guide Dashboard</div>
                    <h1 className="dashboard-title">Welcome, {user?.name}</h1>
                    <p className="dashboard-subtitle">
                        Manage your guide profile and (soon) your tourist inquiries.
                    </p>
                </div>
                <div className={`profile-status ${isProfileComplete ? 'complete' : 'incomplete'}`}>
                    {isProfileComplete ? '✓ Profile complete' : '◯ Profile incomplete'}
                </div>
            </header>

            <section className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-value">{bookings.filter(b => b.status === 'pending').length}</div>
                    <div className="stat-label">Pending requests</div>
                    <div className="stat-note">Awaiting your response</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{bookings.filter(b => ['accepted', 'completed'].includes(b.status)).length}</div>
                    <div className="stat-label">Confirmed / done</div>
                    <div className="stat-note">Accepted + completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{guideMeta?.avg_rating ? Number(guideMeta.avg_rating).toFixed(1) : '—'}</div>
                    <div className="stat-label">Rating</div>
                    <div className="stat-note">{guideMeta?.review_count || 0} reviews</div>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="section-head-row">
                    <h2 className="section-heading">Booking requests</h2>
                    <Link to="/bookings" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
                        Full list →
                    </Link>
                </div>
                {bookings.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>No bookings yet. Once your profile is complete and verified, tourists can book you.</p>
                ) : (
                    <ul className="booking-list booking-list-compact">
                        {bookings.slice(0, 5).map((b) => (
                            <li key={b.id} className={`booking-item bk-${b.status}`}>
                                <div className="booking-main">
                                    <div className="booking-who">
                                        <div className="booking-other">🧳 {b.tourist_name}</div>
                                        <div className="booking-sub mono">{b.tourist_email}</div>
                                    </div>
                                    <div className="booking-date">
                                        <div className="booking-date-main">{new Date(b.booking_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                        <div className="booking-sub">{b.hours}h{b.total_price != null ? ` · $${Number(b.total_price).toFixed(2)}` : ''}</div>
                                    </div>
                                    <span className={`bk-status bk-status-${b.status}`}>{b.status}</span>
                                </div>
                                {b.notes && <div className="booking-notes">“{b.notes}”</div>}
                                {b.status === 'pending' && (
                                    <div className="booking-actions">
                                        <button className="admin-btn-primary" onClick={() => updateBooking(b.id, 'accepted')}>Accept</button>
                                        <button className="admin-btn-danger" onClick={() => updateBooking(b.id, 'declined')}>Decline</button>
                                    </div>
                                )}
                                {b.status === 'accepted' && (
                                    <div className="booking-actions">
                                        <button className="admin-btn-primary" onClick={() => updateBooking(b.id, 'completed')}>Mark complete</button>
                                        <button className="admin-btn-danger" onClick={() => updateBooking(b.id, 'cancelled')}>Cancel</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="dashboard-section">
                <h2 className="section-heading">Your public profile</h2>
                <p className="section-help">
                    This is what tourists will see when browsing guides. Fields marked with * are recommended.
                </p>

                {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {saved && <div className="save-success">✓ Profile saved</div>}

                <form onSubmit={handleSubmit} className="profile-form">
                    <label className="auth-label">
                        <span>Location *</span>
                        <input
                            type="text"
                            value={profile.location}
                            onChange={handleChange('location')}
                            placeholder="e.g. Kathmandu, Nepal"
                            maxLength={150}
                        />
                    </label>

                    <label className="auth-label">
                        <span>Languages *</span>
                        <input
                            type="text"
                            value={profile.languages}
                            onChange={handleChange('languages')}
                            placeholder="e.g. English, Nepali, Hindi"
                            maxLength={255}
                        />
                    </label>

                    <label className="auth-label">
                        <span>Specialties</span>
                        <input
                            type="text"
                            value={profile.specialties}
                            onChange={handleChange('specialties')}
                            placeholder="e.g. Trekking, Cultural tours, Food"
                            maxLength={255}
                        />
                    </label>

                    <label className="auth-label">
                        <span>Hourly rate (USD)</span>
                        <input
                            type="number"
                            value={profile.hourly_rate}
                            onChange={handleChange('hourly_rate')}
                            placeholder="e.g. 25"
                            min="0"
                            step="1"
                        />
                    </label>

                    <label className="auth-label">
                        <span>Phone / WhatsApp</span>
                        <input
                            type="tel"
                            value={profile.phone}
                            onChange={handleChange('phone')}
                            placeholder="Shown to tourists who book (future)"
                            maxLength={50}
                        />
                    </label>

                    <label className="auth-label profile-bio-label">
                        <span>Bio *</span>
                        <textarea
                            rows={5}
                            value={profile.bio}
                            onChange={handleChange('bio')}
                            placeholder="Tell tourists about yourself — your experience, what tours you run, why they should pick you."
                        />
                    </label>

                    <button type="submit" className="auth-submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Save profile'}
                    </button>
                </form>
            </section>

            <section className="dashboard-section coming-soon">
                <h2 className="section-heading">Coming soon</h2>
                <ul className="coming-list">
                    <li>📅 Availability calendar</li>
                    <li>💳 Payment handling (Stripe)</li>
                    <li>📈 Earnings dashboard</li>
                    <li>🌐 Shareable profile link</li>
                </ul>
            </section>
        </div>
    );
}
