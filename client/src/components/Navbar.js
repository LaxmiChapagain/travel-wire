import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const COUNTRIES = [
    { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();
    const dropdownRef = useRef(null);

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
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setDropdownOpen(false);
    }, [location]);

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
                </ul>
            </div>
        </nav>
    );
}
