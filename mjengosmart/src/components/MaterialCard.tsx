// ============================================================
// MjengoSmart — Material Card Component
// Reusable card for marketplace material listings
// ============================================================

import React, { useState } from 'react';
import { orderService } from '../services/api';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import type { Material } from '../types';

interface MaterialCardProps {
  material:       Material;
  onOrderSuccess?: () => void;
  showSupplier?:  boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  Cement:     '🏗️',
  Steel:      '🔩',
  Timber:     '🌲',
  Sand:       '⛏️',
  Roofing:    '🏠',
  Tiles:      '🟫',
  Paint:      '🎨',
  Electrical: '⚡',
  Plumbing:   '🔧',
  Other:      '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  Cement:     'badge-muted',
  Steel:      'badge-blue',
  Timber:     'badge-green',
  Sand:       'badge-amber',
  Roofing:    'badge-accent',
  Tiles:      'badge-blue',
  Paint:      'badge-accent',
  Electrical: 'badge-amber',
  Plumbing:   'badge-blue',
  Other:      'badge-muted',
};

export default function MaterialCard({
  material,
  onOrderSuccess,
  showSupplier = true,
}: MaterialCardProps) {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [showOrder, setShowOrder] = useState(false);
  const [qty,       setQty]       = useState(1);
  const [address,   setAddress]   = useState('');
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const inStock = material.stock_quantity > 0;

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login', { state: { from: '/marketplace' } });
      return;
    }

    if (!address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }
    if (qty < 1 || qty > material.stock_quantity) {
      setError(`Quantity must be between 1 and ${material.stock_quantity}.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await orderService.create({
        material:         material.id,
        quantity:         qty,
        delivery_address: address.trim(),
        notes:            notes.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        setShowOrder(false);
        setSuccess(false);
        setQty(1);
        setAddress('');
        setNotes('');
        onOrderSuccess?.();
      }, 2000);
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setError(e.detail ?? 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = qty * material.price;

  return (
    <div className="card card-interactive" style={{ overflow: 'hidden' }}>
      {/* Image / Placeholder */}
      <div style={{
        height:     160,
        background: material.image
          ? `url(${material.image}) center/cover`
          : 'linear-gradient(135deg, var(--bg-muted), var(--border))',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize:   '3rem',
        position:   'relative',
      }}>
        {!material.image && (
          <span>{CATEGORY_ICONS[material.category] ?? '📦'}</span>
        )}

        {/* Stock Badge */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span className={`badge ${inStock ? 'badge-green' : 'badge-red'}`}>
            {inStock ? `✓ ${material.stock_quantity} ${material.unit}` : 'Out of Stock'}
          </span>
        </div>

        {/* Category Badge */}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span className={`badge ${CATEGORY_COLORS[material.category] ?? 'badge-muted'}`}>
            {material.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontWeight: 700,
          fontSize:   '1rem',
          color:      'var(--text)',
          marginBottom: 4,
        }}>
          {material.name}
        </h3>

        {material.description && (
          <p style={{
            fontSize:   '0.82rem',
            color:      'var(--text-3)',
            lineHeight: 1.5,
            marginBottom: 10,
            overflow:   'hidden',
            display:    '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {material.description}
          </p>
        )}

        {showSupplier && material.supplier_name && (
          <p style={{
            fontSize:     '0.78rem',
            color:        'var(--text-3)',
            marginBottom: 10,
            display:      'flex',
            alignItems:   'center',
            gap:          4,
          }}>
            🏪 {material.supplier_name}
            {material.supplier_location && (
              <span style={{ color: 'var(--border-dark)' }}>· {material.supplier_location}</span>
            )}
          </p>
        )}

        {/* Price Row */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   12,
        }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--accent)' }}>
              KES {material.price.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginLeft: 4 }}>
              / {material.unit}
            </span>
          </div>
        </div>

        {/* Order Button / Form */}
        {!showOrder ? (
          <button
            className={inStock ? 'btn-primary' : 'btn-ghost'}
            style={{ width: '100%' }}
            onClick={() => inStock && setShowOrder(true)}
            disabled={!inStock}
          >
            {inStock ? '🛒 Order Now' : 'Unavailable'}
          </button>
        ) : (
          <div style={{
            background:   'var(--bg-muted)',
            borderRadius: 'var(--radius-md)',
            padding:      '14px',
            border:       '1px solid var(--border)',
            animation:    'pageEnter 0.2s ease',
          }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: 6 }}>✅</div>
                <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>
                  Order placed successfully!
                </p>
              </div>
            ) : (
              <form onSubmit={handleOrder}>
                {/* Qty */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="input-label" style={{ fontSize: '0.78rem' }}>
                    Quantity ({material.unit}) *
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    min={1}
                    max={material.stock_quantity}
                    style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Address */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="input-label" style={{ fontSize: '0.78rem' }}>
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Westlands, Nairobi"
                    style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Notes */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="input-label" style={{ fontSize: '0.78rem' }}>
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions"
                    style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Total */}
                <div style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  padding:        '8px 0',
                  borderTop:      '1px solid var(--border)',
                  marginBottom:   '0.75rem',
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Total</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem' }}>
                    KES {totalPrice.toLocaleString()}
                  </span>
                </div>

                {error && (
                  <div className="alert alert-error" style={{ marginBottom: '0.75rem', padding: '8px 12px', fontSize: '0.78rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ flex: 1, padding: '8px', fontSize: '0.82rem' }}
                    onClick={() => { setShowOrder(false); setError(''); }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 2, padding: '8px', fontSize: '0.82rem' }}
                    disabled={loading}
                  >
                    {loading ? 'Placing…' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}