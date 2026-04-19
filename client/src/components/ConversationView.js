import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export default function ConversationView() {
    const { id } = useParams();
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);

    const authHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }), [token]);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/conversations/${id}`, { headers: authHeaders() });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'failed');
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id, authHeaders]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [data?.messages?.length]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`/api/conversations/${id}/messages`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ body: body.trim() }),
            });
            const msg = await res.json();
            if (!res.ok) throw new Error(msg.error || 'failed');
            setData((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
            setBody('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="dashboard-loading">Loading conversation…</div>;
    if (error) return <div className="dashboard-loading">Error: {error} <button onClick={() => navigate('/messages')}>Back</button></div>;
    if (!data) return null;

    const otherName = user?.role === 'tourist' ? data.conversation.guide_name : data.conversation.tourist_name;
    const otherIsGuide = user?.role === 'tourist';

    return (
        <div className="conversation-view">
            <div className="conversation-topbar">
                <Link to="/messages" className="back-link">← Messages</Link>
                <div className="conversation-topinfo">
                    <div className="conversation-topname">{otherName}</div>
                    {otherIsGuide && data.conversation.guide_location && (
                        <div className="conversation-topsub">📍 {data.conversation.guide_location}</div>
                    )}
                </div>
            </div>

            <div className="message-stream">
                {data.messages.length === 0 && (
                    <div className="empty-state"><p>No messages yet. Say hi!</p></div>
                )}
                {data.messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                        <div key={m.id} className={`message-bubble ${mine ? 'mine' : 'theirs'}`}>
                            <div className="message-body">{m.body}</div>
                            <div className="message-meta">{formatTime(m.created_at)}</div>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="message-composer">
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message…"
                    rows={2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                        }
                    }}
                />
                <button type="submit" className="auth-submit" disabled={sending || !body.trim()}>
                    {sending ? '…' : 'Send'}
                </button>
            </form>
        </div>
    );
}
