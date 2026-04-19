import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register, loading } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [role, setRole] = useState('tourist');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        try {
            const createdUser = await register(name, email, password, role);
            navigate(createdUser?.role === 'guide' ? '/dashboard' : '/', { replace: true });
        } catch (err) {
            setError(err.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">✨</div>
                    <h1 className="auth-title">Create your account</h1>
                    <p className="auth-subtitle">Start planning your next adventure</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="role-selector">
                        <span className="auth-label-text">I am a…</span>
                        <div className="role-options">
                            <label className={`role-option ${role === 'tourist' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="tourist"
                                    checked={role === 'tourist'}
                                    onChange={() => setRole('tourist')}
                                />
                                <span className="role-emoji">🧳</span>
                                <span className="role-name">Tourist</span>
                                <span className="role-desc">Explore and book travel guides</span>
                            </label>
                            <label className={`role-option ${role === 'guide' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="guide"
                                    checked={role === 'guide'}
                                    onChange={() => setRole('guide')}
                                />
                                <span className="role-emoji">🧭</span>
                                <span className="role-name">Travel Guide</span>
                                <span className="role-desc">Offer tours and connect with tourists</span>
                            </label>
                        </div>
                    </div>

                    <label className="auth-label">
                        <span>Name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                            autoComplete="name"
                        />
                    </label>

                    <label className="auth-label">
                        <span>Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </label>

                    <label className="auth-label">
                        <span>Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </label>

                    <label className="auth-label">
                        <span>Confirm password</span>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Re-enter password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </label>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}
