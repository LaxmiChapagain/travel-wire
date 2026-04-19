import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
    pending: { label: 'Pending', className: 'bk-status-pending' },
    accepted: { label: 'Accepted', className: 'bk-status-accepted' },
    declined: { label: 'Declined', className: 'bk-status-declined' },
    completed: { label: 'Completed', className: 'bk-status-completed' },
    cancelled: { label: 'Cancelled', className: 'bk-status-cancelled' },
};

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyBookings() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'failed');
            setBookings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);
    useEffect(() => { load(); }, [load]);

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/bookings/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'failed');
            load();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="dashboard-loading">Loading bookings…</div>;

    const isTourist = user?.role === 'tourist';

    return (
        <div className="bookings-page">
            <header className="directory-header">
                <h1 className="directory-title">{isTourist ? 'My Bookings' : 'Booking Requests'}</h1>
                <p className="directory-subtitle">
                    {isTourist ? 'Trips you\'ve requested with travel guides.' : 'Tourists who want to book your time.'}
                </p>
            </header>

            {error && <div className="auth-error">{error}</div>}

            {bookings.length === 0 ? (
                <div className="empty-state">
                    {isTourist ? (
                        <>
                            <p>No bookings yet. Find a guide and request your first trip.</p>
                            <button className="auth-submit" onClick={() => navigate('/guides')}>Browse guides</button>
                        </>
                    ) : (
                        <p>No booking requests yet. Complete your profile so tourists can find you — check your <Link to="/dashboard">dashboard</Link>.</p>
                    )}
                </div>
            ) : (
                <ul className="booking-list">
                    {bookings.map((b) => {
                        const statusInfo = STATUS_LABELS[b.status] || { label: b.status, className: '' };
                        const other = isTourist ? b.guide_name : b.tourist_name;
                        const tourOptions = isTourist
                            ? (['pending', 'accepted'].includes(b.status) ? [{ s: 'cancelled', label: 'Cancel' }] : [])
                            : (b.status === 'pending'
                                ? [{ s: 'accepted', label: 'Accept', variant: 'primary' }, { s: 'declined', label: 'Decline', variant: 'danger' }]
                                : (b.status === 'accepted'
                                    ? [{ s: 'completed', label: 'Mark complete', variant: 'primary' }, { s: 'cancelled', label: 'Cancel', variant: 'danger' }]
                                    : []));
                        return (
                            <li key={b.id} className={`booking-item bk-${b.status}`}>
                                <div className="booking-main">
                                    <div className="booking-who">
                                        <div className="booking-other">{isTourist ? '🧭 ' : '🧳 '}{other}</div>
                                        {isTourist && b.guide_location && <div className="booking-sub">{b.guide_location}</div>}
                                        {!isTourist && <div className="booking-sub mono">{b.tourist_email}</div>}
                                    </div>
                                    <div className="booking-date">
                                        <div className="booking-date-main">{formatDate(b.booking_date)}</div>
                                        <div className="booking-sub">{b.hours}h{b.total_price != null ? ` · $${Number(b.total_price).toFixed(2)}` : ''}</div>
                                    </div>
                                    <span className={`bk-status ${statusInfo.className}`}>{statusInfo.label}</span>
                                </div>
                                {b.notes && <div className="booking-notes">“{b.notes}”</div>}
                                {tourOptions.length > 0 && (
                                    <div className="booking-actions">
                                        {tourOptions.map((opt) => (
                                            <button
                                                key={opt.s}
                                                className={
                                                    opt.variant === 'primary' ? 'admin-btn-primary'
                                                    : opt.variant === 'danger' ? 'admin-btn-danger'
                                                    : 'btn-secondary'
                                                }
                                                onClick={() => updateStatus(b.id, opt.s)}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
