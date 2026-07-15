// ============================================================
// MjengoSmart — Worker Card Component
// Displays fundi profile with booking CTA
// Part of the Reputation-Based Labor Directory (Objective 3)
// ============================================================

import React, { useState } from 'react';
import StarRating from './StarRating';
import BookingModal from './BookingModal';
import type { Worker } from '../types';

interface WorkerCardProps {
  worker:          Worker;
  onReviewClick?:  (worker: Worker) => void;
  highlighted?:    boolean;
}

const SKILL_ICONS: Record<string, string> = {
  Mason:          '🧱',
  Plumber:        '🔧',
  Electrician:    '⚡',
  Carpenter:      '🪚',
  Painter:        '🎨',
  Welder:         '🔥',
  Tiler:          '🟫',
  Roofer:         '🏠',
  'General Labour':'💪',
  Supervisor:     '📋',
};

const SKILL_COLORS: Record<string, string> = {
  Mason:          'badge-muted',
  Plumber:        'badge-blue',
  Electrician:    'badge-amber',
  Carpenter:      'badge-green',
  Painter:        'badge-accent',
  Welder:         'badge-red',
  Tiler:          'badge-blue',
  Roofer:         'badge-accent',
  'General Labour':'badge-muted',
  Supervisor:     'badge-green',
};

export default function WorkerCard({ worker, onReviewClick, highlighted }: WorkerCardProps) {
  const [showBooking, setShowBooking] = useState(false);

  const skillIcon  = SKILL_ICONS[worker.skill_type]  ?? '👷';
  const skillColor = SKILL_COLORS[worker.skill_type] ?? 'badge-muted';

  // Safe numeric values
  const rating = worker.rating ?? 0;
  const dailyRate = worker.daily_rate ?? 0;
  const experienceYears = worker.experience_years ?? 0;

  return (
    <>
      <div
        className="card card-interactive"
        style={{
          padding:    '20px',
          outline:    highlighted ? '2px solid var(--accent)' : 'none',
          outlineOffset: highlighted ? '2px' : '0',
        }}
      >
        {/* Header Row */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{
            width:          56,
            height:         56,
            borderRadius:   '50%',
            background:     'linear-gradient(135deg, var(--blue-pale), var(--blue))',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '1.6rem',
            flexShrink:     0,
            boxShadow:      'var(--shadow-sm)',
          }}>
            {skillIcon}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                {worker.full_name ?? `${worker.skill_type} #${worker.id}`}
              </h3>
              <span className={`badge ${worker.is_available ? 'badge-green' : 'badge-red'}`}>
                {worker.is_available ? '● Available' : '○ Busy'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span className={`badge ${skillColor}`}>
                {skillIcon} {worker.skill_type}
              </span>
              {experienceYears > 0 && (
                <span className="badge badge-muted">
                  {experienceYears} yr{experienceYears !== 1 ? 's' : ''} exp
                </span>
              )}
            </div>

            <div style={{ marginTop: 6 }}>
              <StarRating
                value={rating}
                size="sm"
                showValue
                showCount={worker.reviews_count}
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        {worker.bio && (
          <p style={{
            fontSize:   '0.83rem',
            color:      'var(--text-3)',
            lineHeight: 1.55,
            marginBottom: 12,
            overflow:   'hidden',
            display:    '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}>
            {worker.bio}
          </p>
        )}

        {/* Details Grid */}
        <div style={{
          display:      'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:          8,
          marginBottom: 14,
        }}>
          <div style={detailBoxStyle}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Daily Rate</span>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent)' }}>
              KES {dailyRate.toLocaleString()}
            </span>
          </div>
          <div style={detailBoxStyle}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Location</span>
            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-2)' }}>
              📍 {worker.location_name ?? (
                worker.latitude != null && worker.longitude != null
                  ? `${worker.latitude.toFixed(2)}°, ${worker.longitude.toFixed(2)}°`
                  : 'Not set'
              )}
            </span>
          </div>
        </div>

        {/* Distance (FIXED) */}
        {worker.distance_km != null && (
          <p style={{
            fontSize:     '0.78rem',
            color:        'var(--accent)',
            fontWeight:   600,
            marginBottom: 12,
          }}>
            📍 {worker.distance_km.toFixed(1)} km from your location
          </p>
        )}

        {/* Portfolio Link */}
        {worker.portfolio_url && (
          <a
            href={worker.portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              fontSize:     '0.8rem',
              color:        'var(--blue)',
              marginBottom: 12,
              fontWeight:   500,
            }}
          >
            🔗 View Portfolio / Past Work
          </a>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-primary"
            style={{ flex: 2, padding: '9px 16px', fontSize: '0.875rem' }}
            onClick={() => setShowBooking(true)}
            disabled={!worker.is_available}
          >
            {worker.is_available ? '📅 Book Now' : 'Not Available'}
          </button>
          {onReviewClick && (
            <button
              className="btn-ghost"
              style={{ flex: 1, padding: '9px 12px', fontSize: '0.875rem' }}
              onClick={() => onReviewClick(worker)}
            >
              ⭐ Review
            </button>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          worker={worker}
          onClose={() => setShowBooking(false)}
          onSuccess={() => setShowBooking(false)}
        />
      )}
    </>
  );
}

const detailBoxStyle: React.CSSProperties = {
  display:        'flex',
  flexDirection:  'column',
  gap:            2,
  background:     'var(--bg-muted)',
  borderRadius:   'var(--radius-md)',
  padding:        '8px 12px',
  border:         '1px solid var(--border)',
};