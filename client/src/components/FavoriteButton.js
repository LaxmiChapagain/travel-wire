import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

// Heart button.
//   variant="overlay"  — absolute-positioned circular button on top of a card image
//   variant="inline"   — sits in the flow with a label
export default function FavoriteButton({ placeId, variant = 'overlay', onChange }) {
    const { isAuthenticated, user } = useAuth();
    const { isFavorited, toggleFavorite } = useFavorites();
    const navigate = useNavigate();

    const active = isFavorited(placeId);
    const canFavorite = isAuthenticated && user?.role === 'tourist';

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canFavorite) {
            if (!isAuthenticated) navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        toggleFavorite(placeId);
        if (onChange) onChange(!active);
    };

    if (!isAuthenticated && variant === 'overlay') {
        // Hide overlay hearts for logged-out viewers — they'd just bounce to login.
        return null;
    }
    if (isAuthenticated && user?.role !== 'tourist' && variant === 'overlay') {
        return null;
    }

    const title = active ? 'Remove from favorites' : 'Save to favorites';

    if (variant === 'inline') {
        return (
            <button
                type="button"
                className={`fav-btn-inline ${active ? 'active' : ''}`}
                onClick={handleClick}
                title={title}
                aria-pressed={active}
            >
                <span className="fav-heart">{active ? '♥' : '♡'}</span>
                {active ? 'Saved' : 'Save'}
            </button>
        );
    }
    return (
        <button
            type="button"
            className={`fav-btn-overlay ${active ? 'active' : ''}`}
            onClick={handleClick}
            title={title}
            aria-pressed={active}
        >
            {active ? '♥' : '♡'}
        </button>
    );
}
