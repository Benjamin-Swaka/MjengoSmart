// ============================================================
// MjengoSmart — Supplier Detail Page
// Full supplier profile with GIS map, inventory, and reviews
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import MaterialCard from '../components/MaterialCard';
import ReviewModal from '../components/ReviewModal';
import StarRating from '../components/StarRating';
import { supplierDetailService, reviewService } from '../services/api';
import type { Material, Review, Supplier, MaterialCategory } from '../types';

const CATEGORIES: MaterialCategory[] = [
  'Cement','Steel','Timber','Sand','Roofing',
  'Tiles','Paint','Electrical','Plumbing','Other',
];

export default function SupplierDetail() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();

  const [supplier,     setSupplier]     = useState<(Supplier & { materials: Material[] }) | null>(null);
  const [inventory,    setInventory]    = useState<Material[]>([]);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [activeTab,    setActiveTab]    = useState<'inventory' | 'map' | 'reviews'>('inventory');
  const [catFilter,    setCatFilter]    = useState<MaterialCategory | ''>('');
  const [showReview,   setShowReview]   = useState(false);

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [sup, inv, rev] = await Promise.all([
          supplierDetailService.get(numId),
          supplierDetailService.inventory(numId),
          reviewService.getForTarget('supplier', numId),
        ]);
        setSupplier(sup);
        setInventory(inv);
        setReviews(rev);
      } catch {
        setError('Supplier not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const filteredInventory = catFilter
    ? inventory.filter((m) => m.category === catFilter)
    : inventory;

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>
            Loading supplier…
          </p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
          <h2 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Supplier Not Found</h2>
          <p style={{ color: 'var(--text-3)', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/marketplace')}>
            ← Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : supplier.rating;

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--text) 0%, #3d2a18 100%)',
        padding:    '2rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
            <button
              onClick={() => navigate('/marketplace')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem',
                fontFamily: 'var(--font-display)',
              }}
            >
              ← Marketplace
            </button>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
              {supplier.business_name}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Supplier Avatar */}
            <div style={{
              width:          80,
              height:         80,
              borderRadius:   'var(--radius-lg)',
              background:     'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '2.5rem',
              flexShrink:     0,
              boxShadow:      '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              🏪
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize:   'clamp(1.4rem, 3vw, 1.9rem)',
                  color:      '#fff',
                  fontWeight: 700,
                }}>
                  {supplier.business_name}
                </h1>
                <span className={`badge ${supplier.is_open_now ? 'badge-green' : 'badge-red'}`}>
                  {supplier.is_open_now ? '● Open Now' : '○ Closed'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)' }}>
                  📍 {supplier.address}
                </p>
                {supplier.distance_km !== undefined && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--accent-2)', fontWeight: 600 }}>
                    · {supplier.distance_km.toFixed(1)} km away
                  </p>
                )}
              </div>

              <StarRating value={avgRating} size="md" showValue showCount={reviews.length} />

              <div style={{ display: 'flex', gap: 10, marginTop: '1rem', flexWrap: 'wrap' }}>
                {supplier.phone && (
                  <a
                    href={`tel:${supplier.phone}`}
                    className="btn-ghost"
                    style={{
                      padding: '8px 16px', fontSize: '0.875rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                    }}
                  >
                    📞 {supplier.phone}
                  </a>
                )}
                <button
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                  onClick={() => setShowReview(true)}
                >
                  ⭐ Write Review
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: '1fr 1fr',
              gap:                 8,
              minWidth:            180,
            }}
              className="hide-mobile"
            >
              {[
                { label: 'Materials',   value: inventory.length, icon: '📦' },
                { label: 'Reviews',     value: reviews.length,   icon: '⭐' },
                { label: 'In Stock',    value: inventory.filter((m) => m.stock_quantity > 0).length, icon: '✓' },
                { label: 'Categories',  value: new Set(inventory.map((m) => m.category)).size, icon: '🏷️' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{
                  background:   'rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding:      '10px 14px',
                  textAlign:    'center',
                  border:       '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div style={{ fontSize: '1rem', marginBottom: 2 }}>{icon}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Opening Hours & Description */}
          <div style={{
            marginTop:  '1.5rem',
            padding:    '14px 18px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius:'var(--radius-md)',
            border:     '1px solid rgba(255,255,255,0.1)',
            display:    'flex',
            gap:        '2rem',
            flexWrap:   'wrap',
          }}>
            {supplier.opening_hours && (
              <div>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Hours</p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                  🕐 {supplier.opening_hours}
                </p>
              </div>
            )}
            {supplier.email && (
              <div>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Email</p>
                <a href={`mailto:${supplier.email}`} style={{ fontSize: '0.875rem', color: 'var(--accent-2)', fontWeight: 500 }}>
                  ✉️ {supplier.email}
                </a>
              </div>
            )}
          </div>

          {supplier.description && (
            <p style={{
              marginTop: '1rem',
              fontSize:  '0.875rem',
              color:     'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              maxWidth:  640,
            }}>
              {supplier.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        background:   'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding:      '0 1.5rem',
        position:     'sticky',
        top:          64,
        zIndex:       80,
      }}>
        <div style={{
          maxWidth: 1100,
          margin:   '0 auto',
          display:  'flex',
          gap:      4,
        }}>
          {([
            { key: 'inventory', label: `📦 Inventory (${inventory.length})` },
            { key: 'map',       label: '🗺️ Map & Location' },
            { key: 'reviews',   label: `⭐ Reviews (${reviews.length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding:        '14px 18px',
                background:     'none',
                border:         'none',
                borderBottom:   `2.5px solid ${activeTab === key ? 'var(--accent)' : 'transparent'}`,
                color:          activeTab === key ? 'var(--accent)' : 'var(--text-3)',
                fontWeight:     activeTab === key ? 700 : 500,
                fontSize:       '0.875rem',
                cursor:         'pointer',
                transition:     'all 150ms',
                fontFamily:     'var(--font-display)',
                whiteSpace:     'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                className={`tab-btn ${!catFilter ? 'active' : ''}`}
                onClick={() => setCatFilter('')}
              >
                All ({inventory.length})
              </button>
              {CATEGORIES.filter((c) => inventory.some((m) => m.category === c)).map((cat) => (
                <button
                  key={cat}
                  className={`tab-btn ${catFilter === cat ? 'active' : ''}`}
                  onClick={() => setCatFilter(cat === catFilter ? '' : cat)}
                >
                  {cat} ({inventory.filter((m) => m.category === cat).length})
                </button>
              ))}
            </div>

            {filteredInventory.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '2.5rem' }}>📦</div>
                <p style={{ marginTop: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>
                  No materials in this category
                </p>
              </div>
            ) : (
              <div className="grid-auto">
                {filteredInventory.map((m) => (
                  <MaterialCard key={m.id} material={m} showSupplier={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && supplier.latitude && supplier.longitude && (
          <div>
            <MapView
              suppliers={[supplier]}
              centerLat={supplier.latitude}
              centerLng={supplier.longitude}
              zoom={15}
              height={480}
              selectedId={supplier.id}
              selectedType="supplier"
            />
            <div className="card" style={{ padding: '16px 20px', marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Address</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
                  📍 {supplier.address}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Coordinates</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', fontFamily: 'monospace' }}>
                  {supplier.latitude.toFixed(5)}, {supplier.longitude.toFixed(5)}
                </p>
              </div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${supplier.latitude}&mlon=${supplier.longitude}&zoom=16`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{ padding: '8px 16px', fontSize: '0.82rem', marginLeft: 'auto' }}
              >
                Open in OpenStreetMap →
              </a>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            {/* Rating summary */}
            <div className="card" style={{
              padding:      '20px 24px',
              marginBottom: '1.5rem',
              display:      'flex',
              gap:          '2rem',
              alignItems:   'center',
              flexWrap:     'wrap',
            }}>
              <div style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--amber)', lineHeight: 1 }}>
                  {avgRating.toFixed(1)}
                </div>
                <StarRating value={avgRating} size="md" showValue={false} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 4 }}>
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count   = reviews.filter((r) => Math.round(r.rating) === star).length;
                  const pct     = reviews.length ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--amber)', width: 30, textAlign: 'right' }}>
                        {'★'.repeat(star)}
                      </span>
                      <div className="progress-bar" style={{ flex: 1, height: 8 }}>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', width: 24 }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              <button
                className="btn-primary"
                onClick={() => setShowReview(true)}
                style={{ padding: '10px 20px' }}
              >
                ⭐ Add Review
              </button>
            </div>

            {/* Review list */}
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '2.5rem' }}>⭐</div>
                <p style={{ marginTop: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>
                  No reviews yet
                </p>
                <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
                  Be the first to review this supplier.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => setShowReview(true)}
                  style={{ marginTop: '1rem' }}
                >
                  Write First Review
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((review) => (
                  <div key={review.id} className="card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{
                          width:          38,
                          height:         38,
                          borderRadius:   '50%',
                          background:     'linear-gradient(135deg, var(--accent), var(--accent-2))',
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'center',
                          color:          '#fff',
                          fontWeight:     700,
                          fontSize:       '0.875rem',
                          flexShrink:     0,
                        }}>
                          {review.reviewer_name?.[0] ?? 'U'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>
                            {review.reviewer_name ?? 'Anonymous'}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                            {new Date(review.created_at).toLocaleDateString('en-KE', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <StarRating value={review.rating} size="sm" showValue />
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReview && (
        <ReviewModal
          targetType="supplier"
          targetId={supplier.id}
          targetName={supplier.business_name}
          onClose={() => setShowReview(false)}
          onSuccess={async () => {
            setShowReview(false);
            const rev = await reviewService.getForTarget('supplier', supplier.id);
            setReviews(rev);
          }}
        />
      )}
    </div>
  );
}