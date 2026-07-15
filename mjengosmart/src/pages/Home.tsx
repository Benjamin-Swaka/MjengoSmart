// ============================================================
// MjengoSmart — Home / Landing Page
// ============================================================

import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supplierService, workerService, materialService } from '../services/api';

// ── Animated Counter Hook ─────────────────────────────────────

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start || target === 0) return;
    const startTime = performance.now();
    const easeOut   = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOut(progress) * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration, start]);

  return value;
}

// ── Intersection Observer Hook ────────────────────────────────

function useInView(threshold = 0.15) {
  const ref             = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ── Stats Counter Card ────────────────────────────────────────

function StatCard({
  target,
  suffix = '',
  label,
  icon,
  color,
  inView,
}: {
  target: number;
  suffix?: string;
  label: string;
  icon: string;
  color: string;
  inView: boolean;
}) {
  const value = useCountUp(target, 1600, inView);

  return (
    <div style={{
      textAlign:      'center',
      padding:        '28px 20px',
      background:     'rgba(255,255,255,0.08)',
      borderRadius:   'var(--radius-lg)',
      border:         '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1 }}>
        {value.toLocaleString()}{suffix}
      </div>
      <div style={{
        fontSize:   '0.875rem',
        color:      'rgba(255,255,255,0.75)',
        marginTop:  6,
        fontWeight: 500,
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
  link,
  linkLabel,
  color,
  badge,
}: {
  icon: string;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
  color: string;
  badge?: string;
}) {
  return (
    <div className="card" style={{
      padding:       '28px',
      display:       'flex',
      flexDirection: 'column',
      gap:           16,
      position:      'relative',
      overflow:      'hidden',
    }}>
      {badge && (
        <div style={{
          position:      'absolute',
          top:           16,
          right:         16,
          background:    color,
          color:         '#fff',
          fontSize:      '0.7rem',
          fontWeight:    700,
          padding:       '3px 10px',
          borderRadius:  '99px',
          letterSpacing: '0.05em',
        }}>
          {badge}
        </div>
      )}

      {/* Decorative blob */}
      <div style={{
        position:      'absolute',
        bottom:        -30,
        right:         -30,
        width:         100,
        height:        100,
        borderRadius:  '50%',
        background:    color,
        opacity:       0.06,
        pointerEvents: 'none',
      }} />

      <div style={{
        width:          54,
        height:         54,
        borderRadius:   'var(--radius-md)',
        background:     `${color}18`,
        border:         `2px solid ${color}30`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '1.6rem',
      }}>
        {icon}
      </div>

      <div>
        <h3 style={{
          fontWeight:   800,
          fontSize:     '1.1rem',
          color:        'var(--text)',
          marginBottom: 8,
        }}>
          {title}
        </h3>
        <p style={{
          fontSize:   '0.88rem',
          color:      'var(--text-3)',
          lineHeight: 1.65,
        }}>
          {description}
        </p>
      </div>

      <Link
        to={link}
        style={{
          display:    'inline-flex',
          alignItems: 'center',
          gap:        6,
          fontSize:   '0.875rem',
          fontWeight: 700,
          color,
          marginTop:  'auto',
          transition: 'gap 150ms',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.gap = '10px';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.gap = '6px';
        }}
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

// ── How It Works Step ─────────────────────────────────────────

function HowStep({
  step,
  icon,
  title,
  desc,
}: {
  step: number;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{
        width:          44,
        height:         44,
        borderRadius:   '50%',
        background:     'var(--accent)',
        color:          '#fff',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontWeight:     800,
        fontSize:       '1rem',
        flexShrink:     0,
        boxShadow:      '0 4px 12px rgba(196,92,26,0.35)',
      }}>
        {step}
      </div>
      <div>
        <div style={{
          display:     'flex',
          alignItems:  'center',
          gap:         8,
          marginBottom: 6,
        }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
            {title}
          </h4>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

// ── Testimonial Card ──────────────────────────────────────────

function TestimonialCard({
  quote,
  name,
  role,
  location,
  rating,
}: {
  quote: string;
  name: string;
  role: string;
  location: string;
  rating: number;
}) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{
        display:      'flex',
        color:        'var(--amber)',
        gap:          2,
        marginBottom: 12,
        fontSize:     '1rem',
      }}>
        {'★'.repeat(rating)}
        <span style={{ color: 'var(--border-dark)' }}>
          {'☆'.repeat(5 - rating)}
        </span>
      </div>

      <p style={{
        fontSize:     '0.9rem',
        color:        'var(--text-2)',
        lineHeight:   1.7,
        fontStyle:    'italic',
        marginBottom: 16,
      }}>
        "{quote}"
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width:          40,
          height:         40,
          borderRadius:   '50%',
          background:     'linear-gradient(135deg, var(--accent), var(--accent-2))',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          '#fff',
          fontWeight:     800,
          fontSize:       '0.875rem',
          flexShrink:     0,
        }}>
          {name[0]}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>
            {name}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
            {role} · {location}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Home Component ───────────────────────────────────────

export default function Home() {
  const [counts, setCounts] = useState({
    suppliers: 0,
    workers:   0,
    materials: 0,
  });

  const { ref: statsRef, inView: statsInView } = useInView();
  const { ref: featRef,  inView: featInView  } = useInView();

  // Suppress unused warning — featInView reserved for future animation
  void featInView;

  // ── Fetch live counts once on mount ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      supplierService.getAll(),
      workerService.getAll(),
      materialService.getAll(),
    ]).then(([s, w, m]) => {
      if (cancelled) return;
      setCounts({
        suppliers: s.status === 'fulfilled' ? s.value.length : 48,
        workers:   w.status === 'fulfilled' ? w.value.length : 127,
        materials: m.status === 'fulfilled' ? m.value.length : 340,
      });
    });

    return () => { cancelled = true; };
  }, []); // ← empty array: runs exactly once

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="page-enter">

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section style={{
        background:  'linear-gradient(135deg, #1a1410 0%, #2d1f14 50%, #3d2a18 100%)',
        minHeight:   '92vh',
        display:     'flex',
        alignItems:  'center',
        position:    'relative',
        overflow:    'hidden',
        padding:     '4rem 1.5rem',
      }}>
        {/* Background radial gradients */}
        <div style={{
          position:        'absolute',
          inset:           0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(196,92,26,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(196,92,26,0.10) 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, rgba(232,114,42,0.08) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Grid lines overlay */}
        <div style={{
          position:        'absolute',
          inset:           0,
          backgroundImage: `
            linear-gradient(rgba(196,92,26,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,92,26,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents:  'none',
        }} />

        <div style={{
          maxWidth: 1200,
          margin:   '0 auto',
          width:    '100%',
          position: 'relative',
          zIndex:   1,
        }}>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
            gap:                 '4rem',
            alignItems:          'center',
          }}>
            {/* ── Left: Headline ── */}
            <div>
              {/* Kenya badge */}
              <div style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          8,
                background:   'rgba(196,92,26,0.2)',
                border:       '1px solid rgba(196,92,26,0.4)',
                borderRadius: '99px',
                padding:      '6px 16px',
                marginBottom: '1.5rem',
              }}>
                <span style={{ fontSize: '0.75rem' }}>🇰🇪</span>
                <span style={{
                  fontSize:      '0.78rem',
                  fontWeight:    600,
                  color:         'rgba(255,255,255,0.9)',
                  letterSpacing: '0.03em',
                }}>
                  Built for Kenya's Construction Sector
                </span>
              </div>

              {/* Main headline */}
              <h1 style={{
                fontFamily:   'var(--font-serif)',
                fontSize:     'clamp(2.2rem, 4.5vw, 3.4rem)',
                fontWeight:   700,
                color:        '#ffffff',
                lineHeight:   1.15,
                marginBottom: '1.25rem',
              }}>
                Build Smarter.{' '}
                <span style={{
                  color:                'transparent',
                  backgroundImage:      'linear-gradient(90deg, #e8722a, #f5a06a)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip:       'text',
                }}>
                  Source Faster.
                </span>
                {' '}Hire Trusted.
              </h1>

              <p style={{
                fontSize:     'clamp(0.95rem, 1.8vw, 1.1rem)',
                color:        'rgba(255,255,255,0.72)',
                lineHeight:   1.75,
                marginBottom: '2rem',
                maxWidth:     520,
              }}>
                MjengoSmart is Kenya's integrated geospatial platform connecting
                homebuilders with verified material suppliers and skilled fundis —
                eliminating information asymmetry in the urban construction sector.
              </p>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  to="/marketplace"
                  className="btn-primary"
                  style={{ fontSize: '1rem', padding: '13px 28px' }}
                >
                  🏪 Explore Marketplace
                </Link>
                <Link
                  to="/estimator"
                  style={{
                    display:        'inline-flex',
                    alignItems:     'center',
                    gap:            8,
                    padding:        '13px 28px',
                    borderRadius:   'var(--radius-md)',
                    border:         '1.5px solid rgba(255,255,255,0.3)',
                    color:          '#fff',
                    fontWeight:     600,
                    fontSize:       '1rem',
                    transition:     'all 200ms',
                    backdropFilter: 'blur(4px)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.7)';
                    (e.currentTarget as HTMLAnchorElement).style.background  = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.3)';
                    (e.currentTarget as HTMLAnchorElement).style.background  = 'transparent';
                  }}
                >
                  📐 Cost Estimator
                </Link>
              </div>

              {/* Trust signals */}
              <div style={{
                display:  'flex',
                gap:      24,
                marginTop:'2.5rem',
                flexWrap: 'wrap',
              }}>
                {[
                  { icon: '✓', text: 'Verified Suppliers'        },
                  { icon: '✓', text: 'Reputation-Based Hiring'   },
                  { icon: '✓', text: 'Real-Time GIS Pricing'     },
                ].map(({ icon, text }) => (
                  <div key={text} style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        8,
                    fontSize:   '0.82rem',
                    color:      'rgba(255,255,255,0.65)',
                  }}>
                    <span style={{
                      width:          18,
                      height:         18,
                      borderRadius:   '50%',
                      background:     'rgba(196,92,26,0.4)',
                      border:         '1px solid rgba(196,92,26,0.6)',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      fontSize:       '0.65rem',
                      fontWeight:     700,
                      color:          '#e8722a',
                      flexShrink:     0,
                    }}>
                      {icon}
                    </span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Visual demo card ── */}
            <div
              className="hide-mobile"
              style={{ position: 'relative', height: 420 }}
            >
              {/* Main glass card */}
              <div style={{
                position:       'absolute',
                top:            '50%',
                left:           '50%',
                transform:      'translate(-50%, -50%)',
                width:          300,
                background:     'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                borderRadius:   'var(--radius-xl)',
                border:         '1px solid rgba(255,255,255,0.15)',
                padding:        '24px',
                boxShadow:      '0 24px 48px rgba(0,0,0,0.4)',
              }}>
                {/* Supplier header */}
                <div style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  marginBottom: 16,
                }}>
                  <div style={{
                    width:          36,
                    height:         36,
                    borderRadius:   '50%',
                    background:     'linear-gradient(135deg, #c45c1a, #e8722a)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       '1rem',
                  }}>
                    🏗️
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>
                      Kamau Hardware
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                      Westlands, Nairobi · 2.3 km
                    </p>
                  </div>
                  <span style={{
                    marginLeft:   'auto',
                    fontSize:     '0.7rem',
                    background:   'rgba(45,106,79,0.4)',
                    color:        '#7ecba0',
                    padding:      '2px 8px',
                    borderRadius: '99px',
                    fontWeight:   700,
                  }}>
                    Open
                  </span>
                </div>

                {/* Material rows */}
                {[
                  { name: 'Portland Cement 50kg', price: 'KES 780',   qty: '240 bags'   },
                  { name: 'River Sand (coarse)',   price: 'KES 3,200', qty: '12 tonnes'  },
                  { name: 'Iron Sheets 28G',       price: 'KES 720',   qty: '85 sheets'  },
                ].map((item) => (
                  <div key={item.name} style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    padding:        '8px 0',
                    borderBottom:   '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div>
                      <p style={{
                        fontSize:  '0.78rem',
                        color:     'rgba(255,255,255,0.85)',
                        fontWeight: 600,
                      }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
                        {item.qty}
                      </p>
                    </div>
                    <span style={{
                      fontSize:  '0.82rem',
                      fontWeight: 800,
                      color:     '#e8722a',
                    }}>
                      {item.price}
                    </span>
                  </div>
                ))}

                {/* Rating row */}
                <div style={{
                  marginTop:      12,
                  background:     'rgba(196,92,26,0.2)',
                  borderRadius:   'var(--radius-md)',
                  padding:        '8px 12px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                    ⭐ 4.7 · 43 reviews
                  </span>
                </div>
              </div>

              {/* Floating badge: GIS */}
              <div style={{
                position:       'absolute',
                top:            40,
                left:           20,
                background:     'rgba(29,78,143,0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius:   'var(--radius-md)',
                padding:        '8px 14px',
                border:         '1px solid rgba(255,255,255,0.15)',
              }}>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                  GIS Locator
                </p>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  📍 48 nearby suppliers
                </p>
              </div>

              {/* Floating badge: fundi */}
              <div style={{
                position:       'absolute',
                bottom:         50,
                right:          10,
                background:     'rgba(45,106,79,0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius:   'var(--radius-md)',
                padding:        '8px 14px',
                border:         '1px solid rgba(255,255,255,0.15)',
              }}>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                  Available Now
                </p>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  👷 John M. · Mason · ⭐ 4.9
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LIVE STATS SECTION
      ═══════════════════════════════════════════════════════ */}
      <section
        ref={statsRef}
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
          padding:    '4rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{
            textAlign:     'center',
            fontSize:      '0.78rem',
            fontWeight:    700,
            color:         'rgba(255,255,255,0.65)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom:  '2rem',
          }}>
            Live Platform Stats
          </p>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap:                 '1.5rem',
          }}>
            <StatCard
              target={counts.suppliers}
              suffix="+"
              label="Verified Suppliers"
              icon="🏪"
              color="#fdf0e8"
              inView={statsInView}
            />
            <StatCard
              target={counts.workers}
              suffix="+"
              label="Skilled Fundis"
              icon="👷"
              color="#fdf0e8"
              inView={statsInView}
            />
            <StatCard
              target={counts.materials}
              suffix="+"
              label="Material Listings"
              icon="📦"
              color="#fdf0e8"
              inView={statsInView}
            />
            <StatCard
              target={95}
              suffix="%"
              label="Client Satisfaction"
              icon="⭐"
              color="#fdf0e8"
              inView={statsInView}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THREE CORE FEATURES
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span
              className="badge badge-accent"
              style={{ marginBottom: 12, fontSize: '0.78rem', display: 'inline-block' }}
            >
              Platform Features
            </span>
            <h2 className="section-title">
              Everything you need to{' '}
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
                build in Kenya
              </span>
            </h2>
            <p
              className="section-subtitle"
              style={{ maxWidth: 560, margin: '0.5rem auto 0' }}
            >
              MjengoSmart addresses all three pillars of construction resource
              optimization — planning, sourcing, and skilled labour.
            </p>
          </div>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap:                 '1.5rem',
          }}>
            <FeatureCard
              icon="📐"
              title="Material Estimation Module"
              description="Input your building dimensions and instantly get a detailed bill of quantities. Our calculator uses Kenyan construction standards to estimate cement, blocks, sand, roofing, and tiling requirements with real Nairobi market prices."
              link="/estimator"
              linkLabel="Try Estimator"
              color="var(--accent)"
              badge="OBJECTIVE 1"
            />
            <FeatureCard
              icon="🗺️"
              title="Geospatial Marketplace"
              description="Browse an interactive map of verified hardware suppliers near your site. Compare real-time prices, check stock availability, place orders, and track delivery — all in one platform built on PostGIS spatial queries."
              link="/marketplace"
              linkLabel="Browse Marketplace"
              color="var(--blue)"
              badge="OBJECTIVE 2"
            />
            <FeatureCard
              icon="👷"
              title="Reputation-Based Labor Directory"
              description="Find verified masons, plumbers, electricians, and other fundis with transparent star ratings from past clients. Review work history, agree on daily rates, and track booking milestones — eliminating the word-of-mouth risk."
              link="/workers"
              linkLabel="Find Fundis"
              color="var(--green)"
              badge="OBJECTIVE 3"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section style={{
        padding:    '5rem 1.5rem',
        background: 'var(--bg-muted)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">How MjengoSmart Works</h2>
            <p className="section-subtitle">
              From planning to completion in four simple steps
            </p>
          </div>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap:                 '2.5rem 3rem',
          }}>
            <HowStep
              step={1}
              icon="📐"
              title="Estimate Your Requirements"
              desc="Enter your building dimensions into the Material Estimator. Get an instant bill of quantities with cost ranges based on current Kenyan market prices."
            />
            <HowStep
              step={2}
              icon="🗺️"
              title="Find Nearby Suppliers"
              desc="Use our GIS-powered map to discover verified hardware suppliers within your radius. Compare prices, check real-time stock, and review supplier ratings."
            />
            <HowStep
              step={3}
              icon="🛒"
              title="Place & Track Orders"
              desc="Order materials directly through the platform. Track your delivery in real-time from 'Dispatched' to 'Delivered' using our order timeline."
            />
            <HowStep
              step={4}
              icon="👷"
              title="Hire a Trusted Fundi"
              desc="Browse skilled workers by trade and location. Check their reputation score, send a booking request, agree on a daily rate, and track work milestones."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PROBLEM & SOLUTION
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">The Problem We Solve</h2>
            <p className="section-subtitle">
              Addressing information asymmetry in Kenya's urban construction sector
            </p>
          </div>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap:                 '2rem',
          }}>
            {/* Problem card */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{
                width:          48,
                height:         48,
                borderRadius:   'var(--radius-md)',
                background:     'var(--red-pale)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '1.4rem',
                marginBottom:   16,
              }}>
                ⚠️
              </div>
              <h3 style={{
                fontWeight:   800,
                fontSize:     '1.05rem',
                color:        'var(--text)',
                marginBottom: 12,
              }}>
                The Problem
              </h3>
              <ul style={{
                listStyle:     'none',
                display:       'flex',
                flexDirection: 'column',
                gap:           10,
              }}>
                {[
                  'Buyers visit multiple hardware stores to compare prices manually',
                  'No real-time material pricing or availability data',
                  'Fundis hired via word-of-mouth with no reputation verification',
                  'Inflated costs and project delays from information asymmetry',
                  "Existing platforms don't support construction logistics",
                ].map((item) => (
                  <li key={item} style={{
                    display:    'flex',
                    gap:        10,
                    fontSize:   '0.85rem',
                    color:      'var(--text-2)',
                    lineHeight: 1.5,
                  }}>
                    <span style={{
                      color:     'var(--red)',
                      flexShrink: 0,
                      fontWeight: 700,
                    }}>
                      ✗
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution card */}
            <div className="card" style={{
              padding:    '28px',
              background: 'linear-gradient(135deg, var(--accent-pale), #fff)',
              borderColor:'var(--accent-mid)',
            }}>
              <div style={{
                width:          48,
                height:         48,
                borderRadius:   'var(--radius-md)',
                background:     'var(--accent)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '1.4rem',
                marginBottom:   16,
              }}>
                🏗️
              </div>
              <h3 style={{
                fontWeight:   800,
                fontSize:     '1.05rem',
                color:        'var(--text)',
                marginBottom: 12,
              }}>
                MjengoSmart's Solution
              </h3>
              <ul style={{
                listStyle:     'none',
                display:       'flex',
                flexDirection: 'column',
                gap:           10,
              }}>
                {[
                  'Single platform with GIS-powered supplier discovery',
                  'Real-time material pricing and stock visibility',
                  'Verified fundi profiles with transparent star ratings',
                  'Client-side material estimator with Kenyan market rates',
                  'Order tracking timeline from placement to delivery',
                ].map((item) => (
                  <li key={item} style={{
                    display:    'flex',
                    gap:        10,
                    fontSize:   '0.85rem',
                    color:      'var(--text-2)',
                    lineHeight: 1.5,
                  }}>
                    <span style={{
                      color:     'var(--accent)',
                      flexShrink: 0,
                      fontWeight: 700,
                    }}>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--bg-muted)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">Trusted by Builders Across Kenya</h2>
            <p className="section-subtitle">What our community says</p>
          </div>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap:                 '1.5rem',
          }}>
            <TestimonialCard
              quote="I used to spend entire days driving around Ngong Road comparing cement prices. MjengoSmart showed me 12 suppliers within 5km in seconds. I saved nearly KES 40,000 on my project."
              name="James Otieno"
              role="Homeowner"
              location="Kilimani, Nairobi"
              rating={5}
            />
            <TestimonialCard
              quote="As a hardware owner, MjengoSmart gave me a digital storefront I couldn't afford alone. My monthly orders increased by 60% in the first three months."
              name="Grace Wanjiku"
              role="Hardware Supplier"
              location="Thika Road"
              rating={5}
            />
            <TestimonialCard
              quote="Before MjengoSmart, clients hired me based on who they knew. Now my 4.8-star rating speaks for itself. I get 3x more booking requests and clients trust me from day one."
              name="Peter Mutua"
              role="Master Mason (Fundi)"
              location="Eastleigh, Nairobi"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1410, #2d1f14)',
        padding:    '5rem 1.5rem',
        textAlign:  'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>

          <h2 style={{
            fontFamily:   'var(--font-serif)',
            fontSize:     'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight:   700,
            color:        '#fff',
            marginBottom: '1rem',
          }}>
            Ready to build smarter?
          </h2>

          <p style={{
            color:        'rgba(255,255,255,0.65)',
            fontSize:     '1rem',
            lineHeight:   1.7,
            marginBottom: '2rem',
          }}>
            Join Kenya's growing network of homebuilders, hardware suppliers,
            and skilled fundis on MjengoSmart.
          </p>

          <div style={{
            display:        'flex',
            gap:            12,
            justifyContent: 'center',
            flexWrap:       'wrap',
          }}>
            <Link
              to="/register"
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '13px 28px' }}
            >
              Create Free Account
            </Link>
            <Link
              to="/marketplace"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            8,
                padding:        '13px 28px',
                borderRadius:   'var(--radius-md)',
                border:         '1.5px solid rgba(255,255,255,0.3)',
                color:          '#fff',
                fontWeight:     600,
                fontSize:       '1rem',
                textDecoration: 'none',
              }}
            >
              Browse Without Account
            </Link>
          </div>

          {/* Academic footer note */}
          <p style={{
            marginTop:  '3rem',
            fontSize:   '0.78rem',
            color:      'rgba(255,255,255,0.3)',
            lineHeight: 1.6,
          }}>
            Final Year Project · Bachelor of Science in Information Technology ·
            Integrated GIS System for Construction Resource Optimization &amp; Labor Management
          </p>
        </div>
      </section>

    </div>
  );
}