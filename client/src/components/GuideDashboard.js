import React, { useEffect, useState, useCallback } from 'react';
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

    const authHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }), [token]);

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
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [authHeaders]);

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
                    <div className="stat-value">0</div>
                    <div className="stat-label">Inquiries</div>
                    <div className="stat-note">Coming with contact feature</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Bookings</div>
                    <div className="stat-note">Coming with booking feature</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">—</div>
                    <div className="stat-label">Rating</div>
                    <div className="stat-note">Coming with reviews</div>
                </div>
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
                    <li>📬 Direct messages from tourists</li>
                    <li>📅 Booking requests and calendar</li>
                    <li>⭐ Verified reviews from past clients</li>
                    <li>💳 Payment handling</li>
                </ul>
            </section>
        </div>
    );
}
