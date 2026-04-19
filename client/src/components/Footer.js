import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div>
                        <div className="footer-brand">🌍 Travel Wire</div>
                        <p className="footer-text" style={{ marginTop: '4px' }}>Discover the world's most amazing destinations.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <Link to="/country/NP" className="footer-text" style={{ transition: 'color 0.2s' }}>Nepal</Link>
                        <Link to="/country/US" className="footer-text" style={{ transition: 'color 0.2s' }}>USA</Link>
                        <Link to="/country/FR" className="footer-text" style={{ transition: 'color 0.2s' }}>France</Link>
                    </div>
                    <p className="footer-text">© 2026 Travel Wire. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
