import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GuidesDirectory() {
    const { isAuthenticated, user, token } = useAuth();
    const navigate = useNavigate();
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [contactingId, setContactingId] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');

    useEffect(() => {
        let cancelled = false;
        fetch('/api/guides')
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled) setGuides(Array.isArray(data) ? data : []);
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, []);

    const canMessage = isAuthenticated && user?.role === 'tourist';

    const openContactFor = (guideId) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/guides' } });
            return;
        }
        setSendError('');
        setMessageText('');
        setContactingId(guideId);
    };

    const submitMessage = async (guideId) => {
        if (!messageText.trim()) {
            setSendError('Write a message first');
            return;
        }
        setSending(true);
        setSendError('');
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ guide_id: guideId, body: messageText.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'failed to send');
            navigate(`/messages/${data.conversation_id}`);
        } catch (err) {
            setSendError(err.message);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="dashboard-loading">Loading guides…</div>;
    if (error) return <div className="dashboard-loading">Error: {error}</div>;

    return (
        <div className="guides-directory">
            <header className="directory-header">
                <h1 className="directory-title">Find a travel guide</h1>
                <p className="directory-subtitle">
                    {guides.length} guide{guides.length === 1 ? '' : 's'} available.
                    {canMessage
                        ? ' Message one to plan your trip.'
                        : user?.role === 'guide'
                            ? ' (Switch to a tourist account to send messages.)'
                            : ' Log in as a tourist to send messages.'}
                </p>
            </header>

            <div className="guides-grid">
                {guides.map((g) => (
                    <article key={g.id} className="guide-card">
                        <div className="guide-card-top">
                            <div className="guide-avatar">{(g.name || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()}</div>
                            <div className="guide-card-head">
                                <h2 className="guide-name">{g.name}</h2>
                                <div className="guide-location">📍 {g.location || 'Location not set'}</div>
                            </div>
                        </div>
                        <p className="guide-bio">{g.bio || <em style={{ color: '#64748b' }}>No bio yet.</em>}</p>
                        <dl className="guide-meta">
                            {g.languages && <><dt>Languages</dt><dd>{g.languages}</dd></>}
                            {g.specialties && <><dt>Specialties</dt><dd>{g.specialties}</dd></>}
                            {g.hourly_rate != null && <><dt>Rate</dt><dd>${g.hourly_rate}/hr</dd></>}
                        </dl>

                        {contactingId === g.id ? (
                            <div className="contact-form">
                                <textarea
                                    rows={3}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder={`Hi ${g.name.split(' ')[0]}, I'm planning a trip to…`}
                                    autoFocus
                                />
                                {sendError && <div className="auth-error" style={{ marginTop: '0.5rem' }}>{sendError}</div>}
                                <div className="contact-form-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setContactingId(null)}
                                        disabled={sending}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="auth-submit"
                                        onClick={() => submitMessage(g.id)}
                                        disabled={sending}
                                    >
                                        {sending ? 'Sending…' : 'Send message'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            canMessage && (
                                <button
                                    type="button"
                                    className="auth-submit guide-card-cta"
                                    onClick={() => openContactFor(g.id)}
                                >
                                    💬 Message {g.name.split(' ')[0]}
                                </button>
                            )
                        )}
                        {!isAuthenticated && (
                            <button
                                type="button"
                                className="btn-secondary guide-card-cta"
                                onClick={() => navigate('/login', { state: { from: '/guides' } })}
                            >
                                Log in to message
                            </button>
                        )}
                    </article>
                ))}
            </div>
        </div>
    );
}
