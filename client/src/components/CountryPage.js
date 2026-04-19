import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';

const COUNTRY_IMAGES = {
    NP: '/images/nepal.jpg',
    US: '/images/usa.jpg',
    FR: '/images/france.jpg',
};

const CATEGORY_ICONS = {
    landmark: '🏛️',
    historic: '🏰',
    nature: '🌿',
    adventure: '⛰️',
    park: '🌳',
};

export default function CountryPage() {
    const { code } = useParams();
    const [country, setCountry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        setLoading(true);
        fetch(`/api/countries/${code}`)
            .then(r => r.json())
            .then(data => {
                setCountry(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [code]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!country) {
        return (
            <div className="loading-container">
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <p>Country not found</p>
                </div>
            </div>
        );
    }

    const categories = ['all', ...new Set(country.places.map(p => p.category).filter(Boolean))];
    const filteredPlaces = activeCategory === 'all'
        ? country.places
        : country.places.filter(p => p.category === activeCategory);

    return (
        <>
            {/* ===== COUNTRY HERO ===== */}
            <section className="country-hero">
                <img
                    src={COUNTRY_IMAGES[country.code] || ''}
                    alt={country.name}
                    className="country-hero-bg"
                />
                <div className="country-hero-overlay" />
                <div className="container">
                    <div className="country-hero-content">
                        <div className="country-hero-flag">{country.flag_emoji}</div>
                        <h1>{country.name}</h1>
                        <p className="country-hero-tagline">{country.hero_tagline}</p>
                        <p className="country-hero-desc">{country.description}</p>
                        <div className="country-info-cards">
                            <div className="country-info-chip">
                                <span>💰</span>
                                <span className="chip-label">Currency:</span>
                                <span className="chip-value">{country.currency}</span>
                            </div>
                            <div className="country-info-chip">
                                <span>🗣️</span>
                                <span className="chip-label">Language:</span>
                                <span className="chip-value">{country.language}</span>
                            </div>
                            <div className="country-info-chip">
                                <span>☀️</span>
                                <span className="chip-label">Best Time:</span>
                                <span className="chip-value">{country.best_season}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== PLACES ===== */}
            <section className="section">
                <div className="container">
                    <div className="section-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                        <span className="section-label">Top Destinations</span>
                        <h2>Places to Visit in {country.name}</h2>
                    </div>

                    {/* Category Filter */}
                    <div className="filter-bar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat === 'all' ? '🌟 All' : `${CATEGORY_ICONS[cat] || '📍'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                            </button>
                        ))}
                    </div>

                    {/* Places Grid */}
                    <div className="places-grid">
                        {filteredPlaces.map((place, i) => (
                            <Link
                                to={`/place/${place.id}`}
                                key={place.id}
                                className={`place-card animate-in animate-in-delay-${(i % 3) + 1}`}
                                id={`place-${place.id}`}
                            >
                                <div className="place-card-image">
                                    {place.image ? (
                                        <img src={`/uploads/${place.image}`} alt={place.name} />
                                    ) : (
                                        <div className="placeholder-img">
                                            {CATEGORY_ICONS[place.category] || '📍'}
                                        </div>
                                    )}
                                    {place.category && (
                                        <span className="place-card-category">{place.category}</span>
                                    )}
                                    {place.avg_rating && (
                                        <span className="place-card-rating">
                                            ⭐ {place.avg_rating}
                                        </span>
                                    )}
                                    <FavoriteButton placeId={place.id} />
                                </div>
                                <div className="place-card-body">
                                    <h3 className="place-card-title">{place.name}</h3>
                                    <div className="place-card-location">
                                        📍 {place.city}, {place.country}
                                    </div>
                                    <p className="place-card-desc">{place.description}</p>
                                    <div className="place-card-footer">
                                        <span className="place-card-reviews">
                                            {place.review_count || 0} review{place.review_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="btn-explore">
                                            Explore →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {!filteredPlaces.length && (
                        <div className="empty-state">
                            <div className="empty-state-icon">🔍</div>
                            <p>No places found in this category.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
