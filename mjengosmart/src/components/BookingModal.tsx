// ============================================================
// MjengoSmart — Worker Booking Modal
// Date selection, rate negotiation, job description form
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/api';
import { useAuth } from '../App';
import StarRating from './StarRating';
import type { Worker } from '../types';

interface BookingModalProps {
  worker:  Worker;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormState {
  start_date:  string;
  end_date:    string;
  description: string;
  agreed_rate: string;
}

const today = new Date().toISOString().split('T')[0];

export default function BookingModal({ worker, onClose, onSuccess }: BookingModalProps) {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [form, setForm] = useState<FormState>({
    start_date:  today,
    end_date:    today,
    description: '',
    agreed_rate: String(worker.daily_rate),
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  // Compute total days / cost
  const startD   = new Date(form.start_date);
  const endD     = new Date(form.end_date);
  const diffMs   = endD.getTime() - startD.getTime();
  const totalDays = Math.max(1, Math.floor(diffMs / 86400000) + 1);
  const rate      = parseFloat(form.agreed_rate) || 0;
  const totalCost = totalDays * rate;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = (): string => {
    if (!form.start_date) return 'Start date is required.';
    if (!form.end_date)   return 'End date is required.';
    if (new Date(form.end_date) < new Date(form.start_date))
      return 'End date must be on or after start date.';
    if (!form.description.trim() || form.description.trim().length < 20)
      return 'Please describe the work (at least 20 characters).';
    if (!form.agreed_rate || parseFloat(form.agreed_rate) <= 0)
      return 'Please enter a valid daily rate.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login', { state: { from: '/workers' } });
      return;
    }

    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
      await bookingService.create({
        worker:      worker.id,
        start_date:  form.start_date,
        end_date:    form.end_date,
        description: form.description.trim(),
        agreed_rate: parseFloat(form.agreed_rate),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setError(e.detail ?? e.message ?? 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {success ? (
          /* Success State */
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', marginBottom: 8 }}>
              Booking Request Sent!
            </h3>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Your request has been sent to{' '}
              <strong style={{ color: 'var(--text)' }}>{worker.full_name}</strong>.
              You'll receive a notification when they respond.
            </p>
            <div className="badge badge-green" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              ✓ Notification sent to worker
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding:      '20px 24px',
              borderBottom: '1px solid var(--border)',
              display:      'flex',
              alignItems:   'flex-start',
              justifyContent: 'space-between',
              gap:          12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width:        52,
                  height:       52,
                  borderRadius: '50%',
                  background:   'linear-gradient(135deg, var(--blue-pale), var(--blue))',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  fontSize:     '1.5rem',
                  flexShrink:   0,
                }}>
                  👷
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                    Book {worker.full_name ?? `Worker #${worker.id}`}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>
                    {worker.skill_type} · {worker.experience_years} yrs exp
                  </p>
                  <StarRating value={worker.rating} size="sm" showValue={false} />
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width:        32,
                  height:       32,
                  borderRadius: 'var(--radius-md)',
                  border:       '1px solid var(--border)',
                  background:   'var(--bg-muted)',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  cursor:       'pointer',
                  fontSize:     '1rem',
                  color:        'var(--text-3)',
                  flexShrink:   0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>

              {/* Date Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="input-label">Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    className="input"
                    value={form.start_date}
                    min={today}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="input-label">End Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    className="input"
                    value={form.end_date}
                    min={form.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Cost Preview */}
              <div style={{
                background:   'var(--accent-pale)',
                border:       '1px solid var(--accent-mid)',
                borderRadius: 'var(--radius-md)',
                padding:      '12px 16px',
                marginBottom: '1.25rem',
                display:      'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap:          8,
                textAlign:    'center',
              }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Duration</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{totalDays}d</p>
                </div>
                <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Daily Rate</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                    KES {rate.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Total Est.</p>
                  <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent)' }}>
                    KES {totalCost.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Agreed Rate */}
              <div className="form-group">
                <label className="input-label">
                  Agreed Daily Rate (KES) *
                  <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 8, fontSize: '0.78rem' }}>
                    Worker's rate: KES {worker.daily_rate.toLocaleString()}/day
                  </span>
                </label>
                <input
                  type="number"
                  name="agreed_rate"
                  className="input"
                  value={form.agreed_rate}
                  onChange={handleChange}
                  min="1"
                  step="50"
                  placeholder="Enter negotiated rate"
                  required
                />
              </div>

              {/* Job Description */}
              <div className="form-group">
                <label className="input-label">Job Description *</label>
                <textarea
                  name="description"
                  className="input"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder={`Describe the work needed. E.g. "Lay floor tiles in 3-bedroom house in Kileleshwa, approximately 120 sqm. Materials provided."`}
                  required
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  {form.description.length}/500 characters (min. 20)
                </p>
              </div>

              {/* Info Note */}
              <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
                <span>ℹ️</span>
                <span style={{ fontSize: '0.82rem' }}>
                  Payment is agreed directly with the fundi. MjengoSmart facilitates
                  the connection and tracks milestone progress.
                </span>
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
                  disabled={loading}
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
                      Sending Request…
                    </>
                  ) : (
                    '📅 Send Booking Request'
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