import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}
function stars(n, total = 5) {
    return '★'.repeat(n) + '☆'.repeat(Math.max(0, total - n));
}

export default function GuideProfile() {
    const { id } = useParams();
    const { isAuthenticated, user, token } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/guides/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'failed');
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="dashboard-loading">Loading guide…</div>;
    if (error) return <div className="dashboard-loading">{error}</div>;
    if (!data) return null;

    const g = data.guide;
    const isTourist = isAuthenticated && user?.role === 'tourist';
    const avgRating = g.avg_rating || 0;
    const initials = (g.name || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="guide-profile">
            <Link to="/guides" className="back-link">← All guides</Link>

            <header className="guide-profile-head">
                <div className="guide-profile-avatar">{initials}</div>
                <div className="guide-profile-head-main">
                    <h1 className="guide-profile-name">
                        {g.name}
                        {g.verified ? <span className="verified-pill"> ✓ Verified</span> : null}
                    </h1>
                    <div className="guide-profile-location">📍 {g.location || 'Location not set'}</div>
                    <div className="guide-profile-rating">
                        <span className="guide-profile-stars">{stars(Math.round(avgRating))}</span>
                        <span className="guide-profile-rating-num">{avgRating ? Number(avgRating).toFixed(1) : 'No rating yet'}</span>
                        <span className="guide-profile-rating-count">({g.review_count || 0} reviews)</span>
                    </div>
                </div>
                <div className="guide-profile-rate">
                    {g.hourly_rate != null ? (
                        <><span className="rate-value">${g.hourly_rate}</span><span className="rate-unit">/hour</span></>
                    ) : (
                        <span className="rate-unit">Rate not set</span>
                    )}
                </div>
            </header>

            <section className="guide-profile-section">
                <h2 className="section-heading">About</h2>
                <p className="guide-profile-bio">{g.bio || <em style={{ color: '#64748b' }}>This guide hasn't written a bio yet.</em>}</p>
                <dl className="guide-meta" style={{ marginTop: '1rem' }}>
                    {g.languages && <><dt>Languages</dt><dd>{g.languages}</dd></>}
                    {g.specialties && <><dt>Specialties</dt><dd>{g.specialties}</dd></>}
                </dl>
            </section>

            <BookingForm guideId={g.id} guideName={g.name} hourlyRate={g.hourly_rate} isTourist={isTourist} isAuthenticated={isAuthenticated} navigate={navigate} />

            <section className="guide-profile-section">
                <div className="section-head-row">
                    <h2 className="section-heading">Reviews ({data.reviews.length})</h2>
                    <Link
                        to={`/guides/${g.id}/message`}
                        onClick={(e) => {
                            e.preventDefault();
                            if (!isTourist) {
                                if (!isAuthenticated) navigate('/login', { state: { from: `/guides/${g.id}` } });
                                return;
                            }
                            // Redirect to directory which already has inline messaging; but smoother UX:
                            // just go to /guides and open contact form there. For simplicity link to it.
                            navigate('/guides');
                        }}
                        className="btn-secondary"
                        style={{ textDecoration: 'none' }}
                    >
                        💬 Message {g.name.split(' ')[0]}
                    </Link>
                </div>
                {isTourist && <ReviewForm guideId={g.id} onSaved={load} existing={data.reviews.find(r => r.tourist_id === user.id)} />}
                {data.reviews.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>No reviews yet. Be the first to book and share your experience!</p>
                ) : (
                    <ul className="review-list">
                        {data.reviews.map((r) => (
                            <li key={r.id} className="review-item">
                                <div className="review-top">
                                    <strong>{r.tourist_name}</strong>
                                    <span className="review-stars">{stars(r.rating)}</span>
                                    <span className="review-date">{formatDate(r.created_at)}</span>
                                </div>
                                {r.comment && <p className="review-comment">{r.comment}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function BookingForm({ guideId, guideName, hourlyRate, isTourist, isAuthenticated, navigate }) {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState('');
    const [hours, setHours] = useState('4');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successId, setSuccessId] = useState(null);

    const total = hourlyRate != null && hours ? (Number(hours) * Number(hourlyRate)) : null;
    const today = new Date().toISOString().slice(0, 10);

    const handleClick = () => {
        if (!isAuthenticated) { navigate('/login', { state: { from: `/guides/${guideId}` } }); return; }
        if (!isTourist) return;
        setOpen(true);
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (!date || !hours || Number(hours) <= 0) {
            setError('Pick a date and enter hours');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ guide_id: guideId, booking_date: date, hours: Number(hours), notes: notes.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'failed');
            setSuccessId(data.id);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="guide-profile-section booking-card">
            <div className="section-head-row">
                <h2 className="section-heading">Book {guideName.split(' ')[0]}</h2>
                {hourlyRate != null && <div className="booking-rate-chip">${hourlyRate}/hr</div>}
            </div>

            {successId ? (
                <div className="save-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✓ Booking #{successId} sent to {guideName}. They'll accept or decline soon.</span>
                    <button className="btn-secondary" onClick={() => navigate('/bookings')}>View my bookings →</button>
                </div>
            ) : !open ? (
                <button type="button" className="auth-submit" onClick={handleClick} disabled={isAuthenticated && !isTourist}>
                    {!isAuthenticated ? 'Log in to book' : (isTourist ? `Book ${guideName.split(' ')[0]}` : 'Only tourists can book')}
                </button>
            ) : (
                <form onSubmit={submit} className="booking-form">
                    <label className="auth-label">
                        <span>Date</span>
                        <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} required />
                    </label>
                    <label className="auth-label">
                        <span>Hours</span>
                        <input type="number" value={hours} min="1" step="0.5" onChange={(e) => setHours(e.target.value)} required />
                    </label>
                    <label className="auth-label booking-notes-label">
                        <span>Notes (optional)</span>
                        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={`What would you like to do with ${guideName.split(' ')[0]}?`} />
                    </label>
                    <div className="booking-total">
                        {total != null ? <>Estimated total: <strong>${total.toFixed(2)}</strong> ({hours}h × ${hourlyRate})</> : <em>No rate set by guide — you'll agree on price in chat.</em>}
                    </div>
                    {error && <div className="auth-error">{error}</div>}
                    <div className="booking-actions">
                        <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
                        <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send booking request'}</button>
                    </div>
                </form>
            )}
        </section>
    );
}

function ReviewForm({ guideId, onSaved, existing }) {
    const { token } = useAuth();
    const [rating, setRating] = useState(existing?.rating || 5);
    const [comment, setComment] = useState(existing?.comment || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`/api/guides/${guideId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rating: Number(rating), comment: comment.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'failed');
            setOpen(false);
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) {
        return (
            <button type="button" className="btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setOpen(true)}>
                {existing ? 'Edit your review' : 'Write a review'}
            </button>
        );
    }
    return (
        <form onSubmit={submit} className="review-inline-form">
            <label className="auth-label">
                <span>Your rating</span>
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>)}
                </select>
            </label>
            <label className="auth-label">
                <span>Comment</span>
                <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share what your trip was like…" />
            </label>
            {error && <div className="auth-error">{error}</div>}
            <div className="booking-actions">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? 'Saving…' : (existing ? 'Update review' : 'Post review')}</button>
            </div>
        </form>
    );
}
