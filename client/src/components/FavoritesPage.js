import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import FavoriteButton from './FavoriteButton';

export default function FavoritesPage() {
    const { token } = useAuth();
    const { ids } = useFavorites();
    const navigate = useNavigate();
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/favorites', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'failed');
            setPlaces(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    // Re-filter on the fly when the user unfavorites from this page (optimistic).
    const visible = places.filter((p) => ids.has(Number(p.id)));

    if (loading) return <div className="dashboard-loading">Loading your favorites…</div>;

    return (
        <div className="favorites-page">
            <header className="directory-header">
                <h1 className="directory-title">❤️ Your favorites</h1>
                <p className="directory-subtitle">
                    {visible.length === 0
                        ? 'No saved places yet. Tap the heart on any place to save it here.'
                        : `${visible.length} saved place${visible.length === 1 ? '' : 's'}.`}
                </p>
            </header>

            {error && <div className="auth-error">{error}</div>}

            {visible.length === 0 ? (
                <div className="empty-state">
                    <p>Start exploring and hit ♡ on places you'd love to visit.</p>
                    <button className="auth-submit" onClick={() => navigate('/')}>
                        Browse destinations
                    </button>
                </div>
            ) : (
                <div className="places-grid">
                    {visible.map((place) => (
                        <Link to={`/place/${place.id}`} key={place.id} className="place-card">
                            <div className="place-card-image">
                                {place.image ? (
                                    <img src={`/uploads/${place.image}`} alt={place.name} />
                                ) : (
                                    <div className="placeholder-img">📍</div>
                                )}
                                {place.category && <span className="place-card-category">{place.category}</span>}
                                {place.avg_rating && <span className="place-card-rating">⭐ {Number(place.avg_rating).toFixed(1)}</span>}
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
            )}
        </div>
    );
}
