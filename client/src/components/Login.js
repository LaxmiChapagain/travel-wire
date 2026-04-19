import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const redirectFrom = location.state?.from;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const loggedInUser = await login(email, password);
            const target = redirectFrom
                || (loggedInUser?.role === 'guide' ? '/dashboard' : '/');
            navigate(target, { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">🔐</div>
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Log in to continue your journey</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
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
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </label>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Logging in…' : 'Log in'}
                    </button>
                </form>

                <p className="auth-footer">
                    New here? <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    );
}
