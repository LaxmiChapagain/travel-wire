import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Usage:
//   <ProtectedRoute><SomePage /></ProtectedRoute>
//   <ProtectedRoute role="guide"><GuideDashboard /></ProtectedRoute>
export default function ProtectedRoute({ role, children }) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    if (role && user?.role !== role) {
        return <Navigate to="/" replace />;
    }
    return children;
}
