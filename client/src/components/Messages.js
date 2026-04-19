import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatWhen(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString();
}

export default function Messages() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [convos, setConvos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'failed');
            setConvos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="dashboard-loading">Loading messages…</div>;

    return (
        <div className="messages-page">
            <header className="directory-header">
                <h1 className="directory-title">Messages</h1>
                <p className="directory-subtitle">
                    {user?.role === 'guide'
                        ? 'Conversations with tourists who reached out to you.'
                        : 'Your conversations with travel guides.'}
                </p>
            </header>

            {error && <div className="auth-error">{error}</div>}

            {convos.length === 0 ? (
                <div className="empty-state">
                    {user?.role === 'tourist' ? (
                        <>
                            <p>You haven't messaged any guides yet.</p>
                            <button className="auth-submit" onClick={() => navigate('/guides')}>
                                Browse guides
                            </button>
                        </>
                    ) : (
                        <p>No tourists have messaged you yet. Make sure your profile is complete — check your <Link to="/dashboard">dashboard</Link>.</p>
                    )}
                </div>
            ) : (
                <ul className="conversation-list">
                    {convos.map((c) => {
                        const isLastFromMe = c.last_sender_id === user?.id;
                        return (
                            <li key={c.conversation_id}>
                                <Link to={`/messages/${c.conversation_id}`} className="conversation-item">
                                    <div className="conversation-avatar">
                                        {(c.other_name || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div className="conversation-body">
                                        <div className="conversation-line1">
                                            <span className="conversation-name">{c.other_name}</span>
                                            {c.other_role === 'guide' && c.other_location && (
                                                <span className="conversation-sub"> · {c.other_location}</span>
                                            )}
                                            <span className="conversation-time">{formatWhen(c.last_message_at || c.updated_at)}</span>
                                        </div>
                                        <div className="conversation-preview">
                                            {isLastFromMe && <span className="conversation-you">You: </span>}
                                            {c.last_message || <em>No messages yet</em>}
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
