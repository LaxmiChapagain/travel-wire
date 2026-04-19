import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
    const { isAuthenticated, user, token } = useAuth();
    // Set of place_ids the current tourist has favorited. Always a Set for O(1) lookup.
    const [ids, setIds] = useState(() => new Set());
    const [loading, setLoading] = useState(false);

    const isTourist = isAuthenticated && user?.role === 'tourist';

    useEffect(() => {
        if (!isTourist) {
            setIds(new Set());
            return;
        }
        let cancelled = false;
        setLoading(true);
        fetch('/api/favorites/ids', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.ok ? r.json() : [])
            .then((arr) => { if (!cancelled) setIds(new Set(arr)); })
            .catch(() => { if (!cancelled) setIds(new Set()); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isTourist, token]);

    const isFavorited = useCallback((placeId) => ids.has(Number(placeId)), [ids]);

    const toggleFavorite = useCallback(async (placeId) => {
        if (!isTourist) return;
        const id = Number(placeId);
        const wasFav = ids.has(id);
        // Optimistic update
        setIds((prev) => {
            const next = new Set(prev);
            if (wasFav) next.delete(id); else next.add(id);
            return next;
        });
        try {
            const res = await fetch(
                wasFav ? `/api/favorites/${id}` : '/api/favorites',
                {
                    method: wasFav ? 'DELETE' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: wasFav ? undefined : JSON.stringify({ place_id: id }),
                }
            );
            if (!res.ok) throw new Error('failed');
        } catch (err) {
            // Rollback on failure
            setIds((prev) => {
                const next = new Set(prev);
                if (wasFav) next.add(id); else next.delete(id);
                return next;
            });
        }
    }, [isTourist, ids, token]);

    return (
        <FavoritesContext.Provider value={{ ids, isFavorited, toggleFavorite, loading, isTourist }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const ctx = useContext(FavoritesContext);
    if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
    return ctx;
}
