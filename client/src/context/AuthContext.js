import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'travelwire_auth';

function readStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => readStorage());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (auth) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [auth]);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'login failed');
            setAuth({ token: data.token, user: data.user });
            return data.user;
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (name, email, password, role = 'tourist') => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'registration failed');
            setAuth({ token: data.token, user: data.user });
            return data.user;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => setAuth(null), []);

    const value = {
        user: auth?.user || null,
        token: auth?.token || null,
        isAuthenticated: !!auth?.token,
        loading,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
