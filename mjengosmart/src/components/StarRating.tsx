// ============================================================
// MjengoSmart — Star Rating Component
// Reusable for display and interactive review submission
// ============================================================

import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  showCount?: number;
  label?: string;
}

const SIZE_MAP = {
  sm: { star: 14, gap: 1, text: '0.75rem' },
  md: { star: 18, gap: 2, text: '0.875rem' },
  lg: { star: 24, gap: 3, text: '1rem' },
};

export default function StarRating({
  value,
  max       = 5,
  size      = 'md',
  interactive = false,
  onChange,
  showValue   = true,
  showCount,
  label,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { star: starSize, gap, text: textSize } = SIZE_MAP[size];

  const displayValue = hovered ?? value;

  const getStarFill = (index: number): 'full' | 'half' | 'empty' => {
    const star = index + 1;
    if (displayValue >= star)           return 'full';
    if (displayValue >= star - 0.5)     return 'half';
    return 'empty';
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {label && (
        <span style={{ fontSize: textSize, color: 'var(--text-3)', fontWeight: 500 }}>
          {label}
        </span>
      )}

      <div
        style={{ display: 'flex', alignItems: 'center', gap }}
        onMouseLeave={() => interactive && setHovered(null)}
        role={interactive ? 'group' : undefined}
        aria-label={interactive ? `Rating: ${value} of ${max}` : undefined}
      >
        {Array.from({ length: max }, (_, i) => {
          const fill  = getStarFill(i);
          const color = fill === 'empty' ? 'var(--border-dark)' : 'var(--amber)';

          if (interactive) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange?.(i + 1)}
                onMouseEnter={() => setHovered(i + 1)}
                aria-label={`Rate ${i + 1} out of ${max}`}
                style={{
                  background: 'none',
                  border:     'none',
                  padding:    0,
                  cursor:     'pointer',
                  color,
                  transition: 'transform 150ms, color 150ms',
                  transform:  hovered === i + 1 ? 'scale(1.3)' : 'scale(1)',
                  lineHeight: 1,
                }}
              >
                <StarSVG size={starSize} fill={fill} />
              </button>
            );
          }

          return (
            <span key={i} style={{ color, lineHeight: 1 }}>
              <StarSVG size={starSize} fill={fill} />
            </span>
          );
        })}
      </div>

      {showValue && (
        <span style={{
          fontSize:   textSize,
          fontWeight: 700,
          color:      'var(--amber)',
        }}>
          {value.toFixed(1)}
        </span>
      )}

      {showCount !== undefined && (
        <span style={{ fontSize: textSize, color: 'var(--text-3)' }}>
          ({showCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}

// ── Star SVG ──────────────────────────────────────────────────

function StarSVG({ size, fill }: { size: number; fill: 'full' | 'half' | 'empty' }) {
  const id = `half-${Math.random().toString(36).slice(2)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {fill === 'half' && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="var(--amber)" />
            <stop offset="50%" stopColor="var(--border-dark)" />
          </linearGradient>
        </defs>
      )}
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={
          fill === 'full'  ? 'currentColor'    :
          fill === 'half'  ? `url(#${id})`     :
          'currentColor'
        }
        stroke={fill === 'empty' ? 'currentColor' : 'none'}
        strokeWidth={fill === 'empty' ? 1.5 : 0}
        opacity={fill === 'empty' ? 0.4 : 1}
      />
    </svg>
  );
}