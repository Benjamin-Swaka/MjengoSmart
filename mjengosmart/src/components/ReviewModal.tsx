// ============================================================
// MjengoSmart — Review Submission Modal
// Star rating + comment form for suppliers and workers
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewService } from '../services/api';
import { useAuth } from '../App';
import StarRating from './StarRating';
import type { ReviewTargetType } from '../types';

interface ReviewModalProps {
  targetType: ReviewTargetType;
  targetId:   number;
  targetName: string;
  onClose:    () => void;
  onSuccess?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor — Not satisfied',
  2: 'Fair — Below expectations',
  3: 'Good — Met expectations',
  4: 'Very Good — Exceeded expectations',
  5: 'Excellent — Outstanding service!',
};

export default function ReviewModal({
  targetType,
  targetId,
  targetName,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await reviewService.create({
        target_type: targetType,
        target_id:   targetId,
        rating,
        comment:     comment.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setError(e.detail ?? 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const emoji = targetType === 'supplier' ? '🏪' : '👷';

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        {success ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', marginBottom: 8 }}>
              Review Submitted!
            </h3>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
              Thank you for helping the MjengoSmart community make better decisions.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding:        '20px 24px',
              borderBottom:   '1px solid var(--border)',
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
            }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                  Write a Review
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>
                  {emoji} {targetName}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '1rem', color: 'var(--text-3)',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {/* Star Selector */}
              <div style={{
                textAlign:    'center',
                padding:      '20px',
                background:   'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
              }}>
                <p style={{
                  fontSize:     '0.875rem',
                  color:        'var(--text-3)',
                  marginBottom: '12px',
                  fontWeight:   500,
                }}>
                  How would you rate your experience?
                </p>

                <StarRating
                  value={rating}
                  size="lg"
                  interactive
                  onChange={setRating}
                  showValue={false}
                />

                {rating > 0 && (
                  <p style={{
                    marginTop:  '10px',
                    fontSize:   '0.875rem',
                    fontWeight: 600,
                    color:      'var(--amber)',
                    animation:  'pageEnter 0.2s ease',
                  }}>
                    {RATING_LABELS[rating]}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="form-group">
                <label className="input-label">Your Review *</label>
                <textarea
                  className="input"
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); setError(''); }}
                  rows={5}
                  placeholder={
                    targetType === 'supplier'
                      ? 'Tell others about the quality of materials, delivery speed, pricing, and customer service...'
                      : 'Tell others about the quality of workmanship, professionalism, punctuality, and communication...'
                  }
                  required
                  style={{ resize: 'vertical', minHeight: 110 }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  {comment.length} characters (min. 10)
                </p>
              </div>

              {/* Guidelines */}
              <div style={{
                background:   'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                padding:      '10px 14px',
                marginBottom: '1.25rem',
              }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-2)' }}>Review Guidelines:</strong>
                  {' '}Be honest, specific, and respectful. Reviews help maintain a
                  trusted reputation system for the Kenyan construction community.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onClose}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2 }}
                  disabled={loading || rating === 0}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Submitting…
                    </>
                  ) : (
                    `⭐ Submit Review`
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}