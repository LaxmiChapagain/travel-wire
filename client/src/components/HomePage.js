import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';

const COUNTRY_IMAGES = {
    NP: '/images/nepal.jpg',
    US: '/images/usa.jpg',
    FR: '/images/france.jpg',
};

const COUNTRY_COLORS = {
    NP: { border: 'rgba(20, 184, 166, 0.4)', glow: 'rgba(20, 184, 166, 0.15)' },
    US: { border: 'rgba(59, 130, 246, 0.4)', glow: 'rgba(59, 130, 246, 0.15)' },
    FR: { border: 'rgba(244, 63, 94, 0.4)', glow: 'rgba(244, 63, 94, 0.15)' },
};

export default function HomePage() {
    const [countries, setCountries] = useState([]);
    const [featuredPlaces, setFeaturedPlaces] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            fetch('/api/countries').then(r => r.json()),
            fetch('/api/places').then(r => r.json()),
        ]).then(([countriesData, placesData]) => {
            setCountries(countriesData);
            // Pick top-rated places across all countries as featured
            const sorted = [...placesData].sort((a, b) =>
                (parseFloat(b.avg_rating) || 0) - (parseFloat(a.avg_rating) || 0)
            );
            setFeaturedPlaces(sorted.slice(0, 6));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!search.trim()) return;
        const match = countries.find(c =>
            c.name.toLowerCase().includes(search.toLowerCase())
        );
        if (match) {
            navigate(`/country/${match.code}`);
        }
    };

    // Floating particles for hero
    const particles = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 8,
            duration: 6 + Math.random() * 8,
            size: 2 + Math.random() * 3,
        })), []);

    const stats = useMemo(() => {
        const totalPlaces = countries.reduce((sum, c) => sum + (c.place_count || 0), 0);
        return {
            countries: countries.length,
            places: totalPlaces,
        };
    }, [countries]);

    return (
        <>
            {/* ===== HERO ===== */}
            <section className="hero" id="hero">
                {/* Animated color orbs */}
                <div className="hero-orb hero-orb-1" />
                <div className="hero-orb hero-orb-2" />
                <div className="hero-orb hero-orb-3" />

                <div className="hero-particles">
                    {particles.map(p => (
                        <span
                            key={p.id}
                            className="hero-particle"
                            style={{
                                left: `${p.left}%`,
                                animationDelay: `${p.delay}s`,
                                animationDuration: `${p.duration}s`,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                            }}
                        />
                    ))}
                </div>

                <div className="hero-content">
                    <div className="hero-badge">
                        ✈️ Your Next Adventure Awaits
                    </div>
                    <h1>
                        Discover the World's<br />
                        <span className="gradient-text">Hidden Gems</span>
                    </h1>
                    <p>
                        Plan your dream trip with curated guides to the most breathtaking
                        destinations across the globe. From Himalayan peaks to Parisian streets.
                    </p>

                    <form className="search-bar" onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Search a country... (Nepal, USA, France)"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            id="hero-search"
                        />
                        <button type="submit">Explore →</button>
                    </form>

                    {/* Live stats */}
                    {!loading && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '3rem',
                            marginTop: '2.5rem',
                            animation: 'fadeInUp 0.6s ease 0.4s both',
                        }}>
                            {[
                                { value: stats.countries, label: 'Countries', color: 'var(--color-teal)' },
                                { value: stats.places, label: 'Destinations', color: 'var(--color-rose)' },
                                { value: '14+', label: 'Reviews', color: 'var(--color-amber)' },
                            ].map((s, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '2rem',
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-heading)',
                                        color: s.color,
                                    }}>
                                        {s.value}
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--color-text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontWeight: 600,
                                    }}>
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ===== COUNTRIES SECTION ===== */}
            <section className="section" id="countries">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Destinations</span>
                        <h2>Explore by Country</h2>
                        <p>Choose a country and discover its most incredible places</p>
                    </div>

                    {loading ? (
                        <div className="loading-container" style={{ minHeight: '300px' }}>
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <div className="countries-grid">
                            {countries.map((country, i) => {
                                const colors = COUNTRY_COLORS[country.code] || {};
                                return (
                                    <Link
                                        to={`/country/${country.code}`}
                                        key={country.code}
                                        className={`country-card animate-in animate-in-delay-${i + 1}`}
                                        id={`country-${country.code}`}
                                        style={{
                                            borderColor: colors.border,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = `0 10px 40px ${colors.glow}`;
                                            e.currentTarget.style.borderColor = colors.border;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = '';
                                            e.currentTarget.style.borderColor = colors.border;
                                        }}
                                    >
                                        <img
                                            src={COUNTRY_IMAGES[country.code] || ''}
                                            alt={country.name}
                                            className="country-card-image"
                                        />
                                        <div className="country-card-overlay" />
                                        <div className="country-card-content">
                                            <div className="country-card-flag">{country.flag_emoji}</div>
                                            <h3 className="country-card-name">{country.name}</h3>
                                            <p className="country-card-tagline">{country.hero_tagline}</p>
                                            <div className="country-card-stats">
                                                <div className="country-card-stat">
                                                    <span className="stat-icon">📍</span>
                                                    {country.place_count} places
                                                </div>
                                                {country.overall_rating && (
                                                    <div className="country-card-stat">
                                                        <span className="stat-icon">⭐</span>
                                                        {country.overall_rating} avg rating
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ===== FEATURED DESTINATIONS ===== */}
            {featuredPlaces.length > 0 && (
                <section className="section" style={{
                    background: 'linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.03), transparent)',
                }}>
                    <div className="container">
                        <div className="section-header">
                            <span className="section-label" style={{ color: 'var(--color-teal)' }}>Top Rated</span>
                            <h2>Featured Destinations</h2>
                            <p>The highest rated places by travelers around the world</p>
                        </div>

                        <div className="places-grid">
                            {featuredPlaces.map((place, i) => (
                                <Link
                                    to={`/place/${place.id}`}
                                    key={place.id}
                                    className={`place-card animate-in animate-in-delay-${(i % 3) + 1}`}
                                >
                                    <div className="place-card-image">
                                        {place.image ? (
                                            <img src={`/uploads/${place.image}`} alt={place.name} />
                                        ) : (
                                            <div className="placeholder-img">📍</div>
                                        )}
                                        {place.category && (
                                            <span className="place-card-category">{place.category}</span>
                                        )}
                                        {place.avg_rating && (
                                            <span className="place-card-rating">⭐ {place.avg_rating}</span>
                                        )}
                                        <FavoriteButton placeId={place.id} />
                                    </div>
                                    <div className="place-card-body">
                                        <h3 className="place-card-title">{place.name}</h3>
                                        <div className="place-card-location">📍 {place.city}, {place.country}</div>
                                        <p className="place-card-desc">{place.description}</p>
                                        <div className="place-card-footer">
                                            <span className="place-card-reviews">
                                                {place.review_count || 0} review{place.review_count !== 1 ? 's' : ''}
                                            </span>
                                            <span className="btn-explore">Explore →</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ===== HOW IT WORKS ===== */}
            <section className="section" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">How It Works</span>
                        <h2>Plan Your Perfect Trip</h2>
                        <p>Three simple steps to your next unforgettable adventure</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem',
                        textAlign: 'center',
                    }}>
                        {[
                            { icon: '🌍', title: 'Pick a Country', desc: 'Browse destinations by country and discover what each has to offer.', color: 'var(--color-teal)' },
                            { icon: '📍', title: 'Explore Places', desc: 'Dive into detailed guides with ratings, reviews, and key highlights.', color: 'var(--color-rose)' },
                            { icon: '✈️', title: 'Plan & Go', desc: 'Save your favorites and start planning your dream adventure.', color: 'var(--color-amber)' },
                        ].map((step, i) => (
                            <div
                                key={i}
                                className={`animate-in animate-in-delay-${i + 1}`}
                                style={{
                                    padding: '2.5rem 2rem',
                                    background: 'var(--gradient-card)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = step.color;
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.transform = '';
                                }}
                            >
                                <div style={{
                                    fontSize: '2.5rem',
                                    marginBottom: '1rem',
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${step.color}15`,
                                }}>{step.icon}</div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: step.color }}>{step.title}</h3>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
