import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'guides', label: 'Guides' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'messages', label: 'Messages' },
];

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminPanel() {
    const { user, token } = useAuth();
    const [tab, setTab] = useState('overview');

    const api = useCallback(async (path, options = {}) => {
        const res = await fetch(`/api/admin${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `request failed (${res.status})`);
        return data;
    }, [token]);

    return (
        <div className="admin-panel">
            <header className="admin-header">
                <div>
                    <div className="dashboard-eyebrow">⚙️ Admin Panel</div>
                    <h1 className="dashboard-title">Hi {user?.name}</h1>
                    <p className="dashboard-subtitle">Full site control. Handle with care.</p>
                </div>
            </header>

            <nav className="admin-tabs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`admin-tab ${tab === t.key ? 'active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </nav>

            <div className="admin-body">
                {tab === 'overview' && <Overview api={api} />}
                {tab === 'users' && <Users api={api} selfId={user?.id} />}
                {tab === 'guides' && <Guides api={api} />}
                {tab === 'reviews' && <Reviews api={api} />}
                {tab === 'messages' && <MessagesMod api={api} />}
            </div>
        </div>
    );
}

function Overview({ api }) {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => { api('/stats').then(setStats).catch((e) => setError(e.message)); }, [api]);
    if (error) return <div className="auth-error">{error}</div>;
    if (!stats) return <div className="dashboard-loading">Loading…</div>;

    const cards = [
        { label: 'Tourists', value: stats.tourists, emoji: '🧳' },
        { label: 'Guides', value: stats.guides, emoji: '🧭' },
        { label: 'Verified Guides', value: stats.verified_guides, emoji: '✓' },
        { label: 'Admins', value: stats.admins, emoji: '⚙️' },
        { label: 'Places', value: stats.places, emoji: '📍' },
        { label: 'Reviews', value: stats.reviews, emoji: '⭐' },
        { label: 'Conversations', value: stats.conversations, emoji: '💬' },
        { label: 'Messages', value: stats.messages, emoji: '✉️' },
    ];

    return (
        <>
            <div className="admin-stat-grid">
                {cards.map((c) => (
                    <div key={c.label} className="admin-stat-card">
                        <div className="admin-stat-emoji">{c.emoji}</div>
                        <div className="admin-stat-value">{c.value}</div>
                        <div className="admin-stat-label">{c.label}</div>
                    </div>
                ))}
            </div>

            <section className="dashboard-section">
                <h2 className="section-heading">Recent signups</h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th><th>Email</th><th>Role</th><th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recent_users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.name}</td>
                                <td className="mono">{u.email}</td>
                                <td><span className={`role-pill role-${u.role}`}>{u.role}</span></td>
                                <td>{formatDate(u.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </>
    );
}

function Users({ api, selfId }) {
    const [users, setUsers] = useState([]);
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(() => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (roleFilter) params.set('role', roleFilter);
        api(`/users?${params.toString()}`).then(setUsers).catch((e) => setError(e.message));
    }, [api, q, roleFilter]);

    useEffect(() => { load(); }, [load]);

    const changeRole = async (id, role) => {
        setBusyId(id);
        try {
            await api(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const del = async (u) => {
        if (!window.confirm(`Delete ${u.email}? This removes their conversations, messages, and profile (cascades).`)) return;
        setBusyId(u.id);
        try {
            await api(`/users/${u.id}`, { method: 'DELETE' });
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="dashboard-section">
            <div className="admin-toolbar">
                <input
                    className="admin-search"
                    placeholder="Search name or email…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <select
                    className="admin-search"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="">All roles</option>
                    <option value="tourist">Tourists</option>
                    <option value="guide">Guides</option>
                    <option value="admin">Admins</option>
                </select>
                <span className="admin-count">{users.length} users</span>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id} className={busyId === u.id ? 'busy' : ''}>
                            <td>{u.id}</td>
                            <td>{u.name}{u.id === selfId && <span className="self-pill"> (you)</span>}</td>
                            <td className="mono">{u.email}</td>
                            <td>
                                <select
                                    value={u.role}
                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                    disabled={busyId === u.id}
                                    className="role-select"
                                >
                                    <option value="tourist">tourist</option>
                                    <option value="guide">guide</option>
                                    <option value="admin">admin</option>
                                </select>
                            </td>
                            <td>{formatDate(u.created_at)}</td>
                            <td>
                                <button
                                    className="admin-btn-danger"
                                    onClick={() => del(u)}
                                    disabled={busyId === u.id || u.id === selfId}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

function Guides({ api }) {
    const [guides, setGuides] = useState([]);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        api('/users?role=guide').then(setGuides).catch((e) => setError(e.message));
    }, [api]);
    useEffect(() => { load(); }, [load]);

    const toggleVerified = async (g) => {
        setBusyId(g.id);
        try {
            await api(`/guides/${g.id}/verify`, {
                method: 'PUT',
                body: JSON.stringify({ verified: !g.guide_verified }),
            });
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="dashboard-section">
            {error && <div className="auth-error">{error}</div>}
            <p className="section-help">Toggle the verified badge to mark a guide as trusted. Shown on their public card.</p>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Name</th><th>Email</th><th>Verified</th><th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {guides.map((g) => (
                        <tr key={g.id}>
                            <td>{g.id}</td>
                            <td>{g.name}</td>
                            <td className="mono">{g.email}</td>
                            <td>{g.guide_verified ? <span className="verified-pill">✓ Verified</span> : <span style={{ color: '#64748b' }}>—</span>}</td>
                            <td>
                                <button
                                    className={g.guide_verified ? 'admin-btn-secondary' : 'admin-btn-primary'}
                                    onClick={() => toggleVerified(g)}
                                    disabled={busyId === g.id}
                                >
                                    {g.guide_verified ? 'Un-verify' : 'Verify'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

function Reviews({ api }) {
    const [reviews, setReviews] = useState([]);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        api('/reviews').then(setReviews).catch((e) => setError(e.message));
    }, [api]);
    useEffect(() => { load(); }, [load]);

    const del = async (r) => {
        if (!window.confirm(`Delete this review by ${r.author}?`)) return;
        setBusyId(r.id);
        try {
            await api(`/reviews/${r.id}`, { method: 'DELETE' });
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="dashboard-section">
            {error && <div className="auth-error">{error}</div>}
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>When</th><th>Place</th><th>Author</th><th>Rating</th><th>Comment</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {reviews.map((r) => (
                        <tr key={r.id}>
                            <td>{formatDate(r.created_at)}</td>
                            <td>{r.place_name} <span style={{ color: '#64748b' }}>({r.country})</span></td>
                            <td>{r.author}</td>
                            <td>{'★'.repeat(r.rating)}<span style={{ color: '#475569' }}>{'★'.repeat(5 - r.rating)}</span></td>
                            <td className="review-cell">{r.comment}</td>
                            <td>
                                <button
                                    className="admin-btn-danger"
                                    onClick={() => del(r)}
                                    disabled={busyId === r.id}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

function MessagesMod({ api }) {
    const [convos, setConvos] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => { api('/conversations').then(setConvos).catch((e) => setError(e.message)); }, [api]);
    return (
        <section className="dashboard-section">
            <p className="section-help">Read-only view of recent conversations. Click a row to open the full thread in a new tab.</p>
            {error && <div className="auth-error">{error}</div>}
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>#</th><th>Tourist</th><th>Guide</th><th>Msgs</th><th>Last message</th><th>Updated</th>
                    </tr>
                </thead>
                <tbody>
                    {convos.map((c) => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.tourist_name}<br /><span className="mono">{c.tourist_email}</span></td>
                            <td>{c.guide_name}<br /><span className="mono">{c.guide_email}</span></td>
                            <td>{c.message_count}</td>
                            <td className="review-cell">{c.last_message || <em>no messages</em>}</td>
                            <td>{formatDate(c.updated_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
