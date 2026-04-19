import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReviewForm from './ReviewForm';

export default function PlaceDetail() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/places/${id}`).then(r => r.json()),
      fetch(`/api/reviews/place/${id}`).then(r => r.json()),
    ])
      .then(([placeData, reviewsData]) => {
        setPlace(placeData);
        setReviews(reviewsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleNewReview = (rev) => {
    setReviews(prev => [rev, ...prev]);
    if (place) {
      const total = (parseFloat(place.avg_rating) || 0) * (place.review_count || 0) + rev.rating;
      const count = (place.review_count || 0) + 1;
      setPlace({ ...place, avg_rating: (total / count).toFixed(2), review_count: count });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="loading-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>Place not found</p>
        </div>
      </div>
    );
  }

  const highlights = place.highlights ? place.highlights.split(' • ') : [];
  const stars = '★'.repeat(Math.round(parseFloat(place.avg_rating) || 0));

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="place-detail-hero">
        {place.image ? (
          <img src={`/uploads/${place.image}`} alt={place.name} className="place-detail-hero-bg" />
        ) : (
          <div className="place-detail-hero-bg placeholder">📍</div>
        )}
        <div className="place-detail-hero-overlay" />

        <div className="container">
          <div className="place-detail-content">
            <div className="place-detail-breadcrumb">
              <Link to="/">Home</Link>
              <span>›</span>
              {place.country_code && (
                <>
                  <Link to={`/country/${place.country_code}`}>{place.country}</Link>
                  <span>›</span>
                </>
              )}
              <span>{place.name}</span>
            </div>

            <div className="place-detail-header">
              <div>
                <h1 className="place-detail-title">{place.name}</h1>
                <p className="place-detail-location">📍 {place.city}, {place.country}</p>
              </div>
              <div className="place-detail-rating-box">
                <div className="place-detail-rating-number">
                  {place.avg_rating || '—'}
                </div>
                <div className="place-detail-rating-stars">{stars || '☆'}</div>
                <div className="place-detail-rating-count">
                  {place.review_count || 0} review{place.review_count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BODY ===== */}
      <section className="place-detail-body">
        <div className="container">
          <div className="detail-grid">
            {/* LEFT COLUMN */}
            <div>
              <p className="detail-description">{place.description}</p>

              {highlights.length > 0 && (
                <>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Highlights</h3>
                  <div className="detail-highlights">
                    {highlights.map((h, i) => (
                      <span key={i} className="highlight-tag">✨ {h.trim()}</span>
                    ))}
                  </div>
                </>
              )}

              {/* Reviews */}
              <div className="reviews-section">
                <h3>Reviews ({reviews.length})</h3>
                {reviews.length > 0 ? (
                  reviews.map(r => (
                    <div key={r.id} className="review-card">
                      <div className="review-header">
                        <span className="review-author">{r.author}</span>
                        <span className="review-rating">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </span>
                      </div>
                      <p className="review-comment">{r.comment}</p>
                      <span className="review-date">
                        {new Date(r.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <p>No reviews yet. Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN — Review Form */}
            <div>
              <div className="review-form-card">
                <h3>Share Your Experience</h3>
                <ReviewForm placeId={id} onSuccess={handleNewReview} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
