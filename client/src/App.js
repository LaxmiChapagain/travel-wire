import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import CountryPage from './components/CountryPage';
import PlaceDetail from './components/PlaceDetail';
import Login from './components/Login';
import Register from './components/Register';
import GuideDashboard from './components/GuideDashboard';
import GuidesDirectory from './components/GuidesDirectory';
import Messages from './components/Messages';
import ConversationView from './components/ConversationView';
import AdminPanel from './components/AdminPanel';
import FavoritesPage from './components/FavoritesPage';
import GuideProfile from './components/GuideProfile';
import MyBookings from './components/MyBookings';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
      <div className="page-wrapper">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/country/:code" element={<CountryPage />} />
            <Route path="/place/:id" element={<PlaceDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="guide">
                  <GuideDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/guides" element={<GuidesDirectory />} />
            <Route path="/guides/:id" element={<GuideProfile />} />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:id"
              element={
                <ProtectedRoute>
                  <ConversationView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute role="tourist">
                  <FavoritesPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
      </FavoritesProvider>
    </AuthProvider>
  );
}
