import React, { useState } from 'react';

export default function ReviewForm({ placeId, onSuccess }) {
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: parseInt(placeId, 10),
          author: author || 'Anonymous',
          rating: parseInt(rating, 10),
          comment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthor('');
        setRating(5);
        setComment('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        onSuccess && onSuccess(data);
      } else {
        alert(data.error || 'Error submitting review');
      }
    } catch (err) {
      console.error(err);
      alert('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {submitted && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-success)',
          fontSize: '0.9rem',
          marginBottom: '1rem',
        }}>
          ✅ Review submitted successfully!
        </div>
      )}

      <div className="form-group">
        <label htmlFor="review-name">Your Name</label>
        <input
          id="review-name"
          className="form-input"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          placeholder="Enter your name (optional)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="review-rating">Rating</label>
        <select
          id="review-rating"
          className="form-select"
          value={rating}
          onChange={e => setRating(e.target.value)}
        >
          <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
          <option value={4}>⭐⭐⭐⭐ Very Good</option>
          <option value={3}>⭐⭐⭐ Good</option>
          <option value={2}>⭐⭐ Poor</option>
          <option value={1}>⭐ Terrible</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="review-comment">Your Experience</label>
        <textarea
          id="review-comment"
          className="form-textarea"
          rows={4}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell us about your visit..."
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
