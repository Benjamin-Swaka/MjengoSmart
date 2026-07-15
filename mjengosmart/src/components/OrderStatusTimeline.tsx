// ============================================================
// MjengoSmart — Order Status Timeline
// Visual progress indicator for order lifecycle
// ============================================================

import React from 'react';
import type { OrderStatus } from '../types';

interface TimelineStep {
  key:       OrderStatus;
  label:     string;
  icon:      string;
  desc:      string;
}

const STEPS: TimelineStep[] = [
  { key: 'pending',    label: 'Order Placed',    icon: '📋', desc: 'Awaiting supplier confirmation' },
  { key: 'confirmed',  label: 'Confirmed',        icon: '✅', desc: 'Supplier has confirmed your order' },
  { key: 'dispatched', label: 'Dispatched',       icon: '🚚', desc: 'Materials are on the way' },
  { key: 'delivered',  label: 'Delivered',        icon: '🏠', desc: 'Materials have been delivered' },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending:    0,
  confirmed:  1,
  dispatched: 2,
  delivered:  3,
  cancelled: -1,
};

interface OrderStatusTimelineProps {
  status:     OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  compact?:   boolean;
}

export default function OrderStatusTimeline({
  status,
  createdAt,
  updatedAt,
  compact = false,
}: OrderStatusTimelineProps) {
  const currentIndex = STATUS_ORDER[status];
  const isCancelled  = status === 'cancelled';

  if (isCancelled) {
    return (
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        padding:      '14px 18px',
        background:   'var(--red-pale)',
        borderRadius: 'var(--radius-md)',
        border:       '1px solid rgba(192,57,43,0.2)',
      }}>
        <span style={{ fontSize: '1.5rem' }}>❌</span>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--red)', fontSize: '0.9rem' }}>
            Order Cancelled
          </p>
          {updatedAt && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
              {formatDate(updatedAt)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Compact mode (horizontal pill) ──────────────────────────

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {STEPS.map((step, idx) => {
          const done    = idx <= currentIndex;
          const current = idx === currentIndex;

          return (
            <React.Fragment key={step.key}>
              <div
                title={step.label}
                style={{
                  width:        8,
                  height:       8,
                  borderRadius: '50%',
                  background:   done
                    ? current ? 'var(--accent)' : 'var(--green)'
                    : 'var(--border)',
                  border:       current ? '2px solid var(--accent)' : 'none',
                  boxShadow:    current ? '0 0 0 3px var(--accent-mid)' : 'none',
                  transition:   'all 300ms',
                }}
              />
              {idx < STEPS.length - 1 && (
                <div style={{
                  height:     2,
                  width:      20,
                  background: idx < currentIndex ? 'var(--green)' : 'var(--border)',
                  borderRadius: 1,
                  transition: 'background 300ms',
                }} />
              )}
            </React.Fragment>
          );
        })}

        <span style={{
          marginLeft: 8,
          fontSize:   '0.78rem',
          fontWeight: 600,
          color:      'var(--accent)',
        }}>
          {STEPS[currentIndex]?.label}
        </span>
      </div>
    );
  }

  // ── Full mode (vertical steps) ───────────────────────────────

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          marginBottom:   6,
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
            Progress
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>
            {Math.round(((currentIndex + 1) / STEPS.length) * 100)}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((step, idx) => {
          const done    = idx < currentIndex;
          const current = idx === currentIndex;
          const future  = idx > currentIndex;

          return (
            <div key={step.key} style={{ display: 'flex', gap: 16, position: 'relative' }}>
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  position:   'absolute',
                  left:       19,
                  top:        40,
                  width:      2,
                  height:     'calc(100% - 8px)',
                  background: done ? 'var(--green)' : 'var(--border)',
                  transition: 'background 300ms',
                }} />
              )}

              {/* Step circle */}
              <div style={{
                width:           40,
                height:          40,
                borderRadius:    '50%',
                background:      done    ? 'var(--green)'
                               : current ? 'var(--accent)'
                               : 'var(--bg-muted)',
                border:          current
                               ? '3px solid var(--accent-2)'
                               : future
                               ? '2px solid var(--border)'
                               : 'none',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                fontSize:        done ? '1rem' : '1.1rem',
                flexShrink:      0,
                boxShadow:       current ? '0 0 0 4px var(--accent-mid)' : 'none',
                transition:      'all 300ms',
                zIndex:          1,
              }}>
                {done ? (
                  <CheckIcon />
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>

              {/* Step content */}
              <div style={{
                paddingBottom: idx < STEPS.length - 1 ? '1.5rem' : 0,
                paddingTop:    6,
                flex:          1,
              }}>
                <p style={{
                  fontWeight: current || done ? 700 : 500,
                  fontSize:   '0.9rem',
                  color:      done    ? 'var(--green)'
                             : current ? 'var(--accent)'
                             : 'var(--text-3)',
                  marginBottom: 2,
                }}>
                  {step.label}
                  {current && (
                    <span style={{
                      marginLeft:   8,
                      fontSize:     '0.72rem',
                      background:   'var(--accent)',
                      color:        '#fff',
                      padding:      '1px 8px',
                      borderRadius: '99px',
                      fontWeight:   600,
                      verticalAlign:'middle',
                    }}>
                      Current
                    </span>
                  )}
                </p>
                <p style={{
                  fontSize:  '0.8rem',
                  color:     future ? 'var(--border-dark)' : 'var(--text-3)',
                  lineHeight: 1.4,
                }}>
                  {step.desc}
                </p>
                {current && updatedAt && (
                  <p style={{
                    fontSize:   '0.75rem',
                    color:      'var(--accent)',
                    fontWeight: 600,
                    marginTop:  4,
                  }}>
                    Updated: {formatDate(updatedAt)}
                  </p>
                )}
                {idx === 0 && createdAt && (
                  <p style={{
                    fontSize:  '0.75rem',
                    color:     'var(--text-3)',
                    marginTop: 4,
                  }}>
                    Placed: {formatDate(createdAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}