import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COUNTRIES = [
    { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const userMenuRef = useRef(null);
    const { isAuthenticated, user, logout } = useAuth();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setDropdownOpen(false);
        setUserMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        navigate('/');
    };

    const initials = user?.name
        ? user.name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : '';

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container">
                <Link to="/" className="navbar-brand">
                    <span className="logo-icon">🌍</span>
                    <span>Travel Wire</span>
                </Link>
                <ul className="navbar-links">
                    <li>
                        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                            Home
                        </Link>
                    </li>
                    {isAuthenticated && user?.role === 'guide' && (
                        <li>
                            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                                Dashboard
                            </Link>
                        </li>
                    )}
                    {isAuthenticated && user?.role === 'admin' && (
                        <li>
                            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                                ⚙️ Admin
                            </Link>
                        </li>
                    )}
                    {(!isAuthenticated || user?.role === 'tourist') && (
                        <li>
                            <Link to="/guides" className={location.pathname === '/guides' ? 'active' : ''}>
                                Find a Guide
                            </Link>
                        </li>
                    )}
                    {isAuthenticated && user?.role === 'tourist' && (
                        <li>
                            <Link to="/favorites" className={location.pathname === '/favorites' ? 'active' : ''}>
                                ♥ Favorites
                            </Link>
                        </li>
                    )}
                    {isAuthenticated && (
                        <li>
                            <Link to="/messages" className={location.pathname.startsWith('/messages') ? 'active' : ''}>
                                Messages
                            </Link>
                        </li>
                    )}
                    <li className="nav-dropdown" ref={dropdownRef}>
                        <button
                            className={`nav-dropdown-trigger ${location.pathname.includes('/country') ? 'active' : ''}`}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            aria-expanded={dropdownOpen}
                            id="countries-dropdown"
                        >
                            Destinations
                            <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▾</span>
                        </button>
                        <div className={`nav-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                            {COUNTRIES.map(c => (
                                <Link
                                    key={c.code}
                                    to={`/country/${c.code}`}
                                    className={`nav-dropdown-item ${location.pathname === `/country/${c.code}` ? 'active' : ''}`}
                                >
                                    <span className="dropdown-flag">{c.flag}</span>
                                    <span>{c.name}</span>
                                </Link>
                            ))}
                        </div>
                    </li>
                    {isAuthenticated ? (
                        <li className="nav-dropdown nav-user" ref={userMenuRef}>
                            <button
                                className="nav-user-trigger"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                aria-expanded={userMenuOpen}
                            >
                                <span className="nav-user-avatar">{initials || '👤'}</span>
                                <span className="nav-user-name">{user?.name}</span>
                                {user?.role === 'guide' && (
                                    <span className="role-badge role-badge-guide">🧭 Guide</span>
                                )}
                                {user?.role === 'admin' && (
                                    <span className="role-badge role-badge-admin">⚙️ Admin</span>
                                )}
                                <span className={`dropdown-arrow ${userMenuOpen ? 'open' : ''}`}>▾</span>
                            </button>
                            <div className={`nav-dropdown-menu ${userMenuOpen ? 'open' : ''}`}>
                                <div className="nav-user-email">
                                    <div>{user?.email}</div>
                                    <div className="nav-user-role">
                                        {user?.role === 'admin' ? '⚙️ Admin'
                                            : user?.role === 'guide' ? '🧭 Travel Guide'
                                            : '🧳 Tourist'}
                                    </div>
                                </div>
                                <button className="nav-dropdown-item nav-logout" onClick={handleLogout}>
                                    Log out
                                </button>
                            </div>
                        </li>
                    ) : (
                        <>
                            <li>
                                <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                                    Log in
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="nav-cta">
                                    Sign up
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}
