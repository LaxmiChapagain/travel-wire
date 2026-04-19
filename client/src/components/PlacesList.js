import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PlacesList() {
  const [places, setPlaces] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/places')
      .then(r => r.json())
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetch(`/api/places?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(setPlaces)
      .catch(() => setPlaces([]));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Places</h2>
        <form className="d-flex" onSubmit={handleSearch}>
          <input className="form-control me-2" value={q} onChange={e => setQ(e.target.value)} placeholder="Search city or name" />
          <button className="btn btn-outline-secondary" type="submit">Search</button>
        </form>
      </div>

      <div className="row">
        {places.map(p => (
          <div key={p.id} className="col-md-4 mb-3">
            <div className="card h-100 shadow-sm">
              {p.image ? (
                <img src={`/uploads/${p.image}`} className="card-img-top" alt={p.name} style={{ height: 180, objectFit: 'cover' }} />
              ) : (
                <div style={{ height: 180, background: '#eee' }} className="d-flex align-items-center justify-content-center">No image</div>
              )}
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{p.name}</h5>
                <p className="card-text text-muted">{p.city}, {p.country}</p>
                <p className="card-text">{p.category ? <span className="badge bg-secondary">{p.category}</span> : null}</p>
                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-warning">{p.avg_rating || '—'} ★</small>
                    <small className="text-muted ms-2">{p.review_count || 0} reviews</small>
                  </div>
                  <Link to={`/place/${p.id}`} className="btn btn-primary btn-sm">View</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!places.length && <p className="text-muted">No places found.</p>}
    </div>
  );
}
