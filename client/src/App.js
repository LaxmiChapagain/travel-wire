import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import CountryPage from './components/CountryPage';
import PlaceDetail from './components/PlaceDetail';

export default function App() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/country/:code" element={<CountryPage />} />
          <Route path="/place/:id" element={<PlaceDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
