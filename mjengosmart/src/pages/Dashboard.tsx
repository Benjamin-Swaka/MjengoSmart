// ============================================================
// MjengoSmart — User Dashboard
// Connected to real API data with role-aware views,
// order timeline, booking management, and notifications
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import StarRating from '../components/StarRating';
import {
  analyticsService,
  orderService,
  bookingService,
  notificationService,
} from '../services/api';
import type {
  AnalyticsData,
  Order,
  BookingRequest,
  Notification,
} from '../types';

// ── Stat Card ─────────────────────────────────────────────────

function StatCard({
  icon, label, value, color = 'var(--accent)', sub,
}: {
  icon: string; label: string; value: string | number;
  color?: string; sub?: string;
}) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width:          48,
        height:         48,
        borderRadius:   'var(--radius-md)',
        background:     `${color}18`,
        border:         `1.5px solid ${color}30`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '1.4rem',
        flexShrink:     0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:    'badge-amber',
    confirmed:  'badge-blue',
    dispatched: 'badge-blue',
    delivered:  'badge-green',
    cancelled:  'badge-red',
    accepted:   'badge-green',
    declined:   'badge-red',
    completed:  'badge-green',
  };
  return (
    <span className={`badge ${map[status] ?? 'badge-muted'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Main Dashboard ────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();

  const [analytics,     setAnalytics]     = useState<AnalyticsData | null>(null);
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [bookings,      setBookings]      = useState<BookingRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState<'overview' | 'orders' | 'bookings' | 'notifications'>('overview');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error,         setError]         = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ana, ord, book, notifs] = await Promise.allSettled([
        analyticsService.get(),
        orderService.getAll(),
        bookingService.getAll(),
        notificationService.getAll(),
      ]);

      if (ana.status   === 'fulfilled') setAnalytics(ana.value);
      if (ord.status   === 'fulfilled') setOrders(ord.value);
      if (book.status  === 'fulfilled') setBookings(book.value);
      if (notifs.status=== 'fulfilled') setNotifications(notifs.value);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const unread = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const handleCancelOrder = async (id: number) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await orderService.cancel(id);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'cancelled' } : o));
      if (selectedOrder?.id === id) setSelectedOrder((o) => o ? { ...o, status: 'cancelled' } : o);
    } catch { /* ignore */ }
  };

  const handleBookingAction = async (id: number, status: 'accepted' | 'declined' | 'completed') => {
    try {
      await bookingService.updateStatus(id, status);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', color: 'var(--text-3)' }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={{
        background:   'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding:      '1.5rem',
        boxShadow:    'var(--shadow-sm)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width:          52,
              height:         52,
              borderRadius:   '50%',
              background:     'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          '#fff',
              fontWeight:     800,
              fontSize:       '1.1rem',
              flexShrink:     0,
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)' }}>
                  {user?.first_name} {user?.last_name}
                </h1>
                <span className={`badge ${
                  user?.role === 'supplier' ? 'badge-blue'   :
                  user?.role === 'worker'   ? 'badge-green'  :
                  user?.role === 'admin'    ? 'badge-accent'  : 'badge-muted'
                }`}>
                  {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                </span>
                {user?.is_verified && (
                  <span className="badge badge-green">✓ Verified</span>
                )}
                {unread > 0 && (
                  <span className="badge badge-red">{unread} new notification{unread > 1 ? 's' : ''}</span>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: 3 }}>
                📍 {user?.location_name || 'No location set'} · {user?.email}
              </p>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to="/estimator"   className="btn-ghost"   style={{ fontSize: '0.875rem', padding: '8px 14px' }}>📐 Estimator</Link>
              <Link to="/marketplace" className="btn-primary" style={{ fontSize: '0.875rem', padding: '8px 14px' }}>🏪 Shop</Link>
            </div>
          </div>
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
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 4 }}>
          {([
            { key: 'overview',      label: '📊 Overview' },
            { key: 'orders',        label: `📦 Orders (${orders.length})` },
            { key: 'bookings',      label: `👷 Bookings (${bookings.length})` },
            { key: 'notifications', label: `🔔 Notifications${unread > 0 ? ` (${unread})` : ''}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding:    '14px 16px',
                background: 'none',
                border:     'none',
                borderBottom: `2.5px solid ${activeTab === key ? 'var(--accent)' : 'transparent'}`,
                color:       activeTab === key ? 'var(--accent)' : 'var(--text-3)',
                fontWeight:  activeTab === key ? 700 : 500,
                fontSize:    '0.875rem',
                cursor:      'pointer',
                transition:  'all 150ms',
                fontFamily:  'var(--font-display)',
                whiteSpace:  'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && analytics && (
          <div style={{ animation: 'pageEnter 0.3s ease' }}>
            {/* Stats grid */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap:                 '1rem',
              marginBottom:        '2rem',
            }}>
              <StatCard
                icon="📦" label="Total Orders"
                value={analytics.total_orders}
                color="var(--blue)"
                sub={`${analytics.pending_orders} pending`}
              />
              <StatCard
                icon="✅" label="Delivered"
                value={analytics.delivered_orders}
                color="var(--green)"
              />
              <StatCard
                icon="💰" label="Total Spent"
                value={`KES ${(analytics.total_spent ?? 0).toLocaleString()}`}
                color="var(--accent)"
                sub="on materials"
              />
              <StatCard
                icon="👷" label="Bookings"
                value={analytics.total_bookings}
                color="var(--blue)"
                sub={`${analytics.active_bookings} active`}
              />
              {analytics.avg_rating !== undefined && (
                <StatCard
                  icon="⭐" label="Your Rating"
                  value={analytics.avg_rating.toFixed(1)}
                  color="var(--amber)"
                  sub={`${analytics.reviews_count} reviews`}
                />
              )}
              <StatCard
                icon="🔔" label="Unread Notifications"
                value={analytics.unread_notifications}
                color="var(--red)"
              />
            </div>

            {/* Recent Orders */}
            {orders.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>Recent Orders</h2>
                  <button
                    onClick={() => setActiveTab('orders')}
                    style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)' }}
                  >
                    View all →
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="card"
                      style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}
                      onClick={() => { setSelectedOrder(order); setActiveTab('orders'); }}
                    >
                      <div style={{ flex: 1, minWidth: 150 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 2 }}>
                          {order.material_name ?? `Material #${order.material}`}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                          {order.supplier_name && `${order.supplier_name} · `}
                          Qty: {order.quantity} {order.material_unit}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <StatusBadge status={order.status} />
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                          KES {order.total_price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap:                 '1rem',
            }}>
              {[
                { to: '/estimator',   icon: '📐', label: 'Estimate Materials', color: 'var(--green)' },
                { to: '/marketplace', icon: '🏪', label: 'Browse Materials',   color: 'var(--blue)'  },
                { to: '/workers',     icon: '👷', label: 'Find Workers',       color: 'var(--accent)'},
              ].map(({ to, icon, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="card"
                  style={{
                    padding:        '20px',
                    display:        'flex',
                    alignItems:     'center',
                    gap:            14,
                    textDecoration: 'none',
                    cursor:         'pointer',
                    transition:     'transform 150ms, box-shadow 150ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; }}
                >
                  <div style={{
                    width:  44, height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: `${color}18`,
                    border: `1.5px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', flexShrink: 0,
                  }}>{icon}</div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div style={{ animation: 'pageEnter 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
              {/* Order List */}
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '1rem' }}>
                  Your Orders
                </h2>

                {orders.length === 0 ? (
                  <div className="empty-state card" style={{ padding: '2.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                    <p style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>No orders yet</p>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                      Browse the marketplace to place your first order.
                    </p>
                    <Link to="/marketplace" className="btn-primary">
                      Shop Now
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="card"
                        style={{
                          padding: '16px 18px',
                          cursor:  'pointer',
                          border:  selectedOrder?.id === order.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                          transition: 'all 150ms',
                        }}
                        onClick={() => setSelectedOrder(order.id === selectedOrder?.id ? null : order)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 3 }}>
                              {order.material_name ?? `Material #${order.material}`}
                            </p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 6 }}>
                              Qty: {order.quantity} {order.material_unit} · {order.delivery_address}
                            </p>
                            <OrderStatusTimeline
                              status={order.status}
                              compact
                              createdAt={order.created_at}
                              updatedAt={order.updated_at}
                            />
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem' }}>
                              KES {order.total_price.toLocaleString()}
                            </p>
                            {order.status === 'pending' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                                style={{
                                  marginTop:  6,
                                  fontSize:   '0.72rem',
                                  color:      'var(--red)',
                                  background: 'none',
                                  border:     'none',
                                  cursor:     'pointer',
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 600,
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Detail Panel */}
              {selectedOrder && (
                <div style={{ animation: 'pageEnter 0.25s ease' }}>
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                        Order Timeline
                      </h3>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{
                      padding:      '12px 14px',
                      background:   'var(--bg-muted)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.5rem',
                    }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 4 }}>
                        {selectedOrder.material_name ?? `Material #${selectedOrder.material}`}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                        📍 {selectedOrder.delivery_address}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
                        Qty: {selectedOrder.quantity} · Total: KES {selectedOrder.total_price.toLocaleString()}
                      </p>
                      {selectedOrder.notes && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
                          📝 {selectedOrder.notes}
                        </p>
                      )}
                    </div>

                    <OrderStatusTimeline
                      status={selectedOrder.status}
                      createdAt={selectedOrder.created_at}
                      updatedAt={selectedOrder.updated_at}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div style={{ animation: 'pageEnter 0.3s ease' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '1rem' }}>
              Booking Requests
            </h2>

            {bookings.length === 0 ? (
              <div className="empty-state card" style={{ padding: '2.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👷</div>
                <p style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>No bookings yet</p>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Browse the workers directory to book a skilled fundi.
                </p>
                <Link to="/workers" className="btn-primary">Find Workers</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookings.map((booking) => {
                  const start = new Date(booking.start_date);
                  const end   = new Date(booking.end_date);
                  const days  = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
                  const total = days * booking.agreed_rate;

                  return (
                    <div key={booking.id} className="card" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Worker avatar */}
                        <div style={{
                          width:          48, height: 48, borderRadius: '50%',
                          background:     'linear-gradient(135deg, var(--blue-pale), var(--blue))',
                          display:        'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize:       '1.4rem', flexShrink: 0,
                        }}>
                          👷
                        </div>

                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                              {booking.worker_name ?? `Worker #${booking.worker}`}
                            </p>
                            {booking.worker_skill && (
                              <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                                {booking.worker_skill}
                              </span>
                            )}
                            <StatusBadge status={booking.status} />
                          </div>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 6, lineHeight: 1.5 }}>
                            {booking.description.slice(0, 100)}{booking.description.length > 100 ? '…' : ''}
                          </p>

                          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                              📅 {start.toLocaleDateString('en-KE')} – {end.toLocaleDateString('en-KE')} ({days}d)
                            </p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>
                              KES {booking.agreed_rate.toLocaleString()}/day · Total: KES {total.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Actions for workers/suppliers */}
                        {booking.status === 'pending' && (user?.role === 'worker' || user?.role === 'supplier') && (
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button
                              className="btn-primary"
                              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                              onClick={() => handleBookingAction(booking.id, 'accepted')}
                            >
                              ✓ Accept
                            </button>
                            <button
                              className="btn-ghost"
                              style={{ padding: '8px 14px', fontSize: '0.82rem', color: 'var(--red)', borderColor: 'var(--red)' }}
                              onClick={() => handleBookingAction(booking.id, 'declined')}
                            >
                              ✕ Decline
                            </button>
                          </div>
                        )}
                        {booking.status === 'accepted' && (
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px 14px', fontSize: '0.82rem', color: 'var(--green)', borderColor: 'var(--green)', flexShrink: 0 }}
                            onClick={() => handleBookingAction(booking.id, 'completed')}
                          >
                            ✓ Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === 'notifications' && (
          <div style={{ animation: 'pageEnter 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>
                Notifications {unread > 0 && (
                  <span className="badge badge-red" style={{ marginLeft: 8 }}>{unread} unread</span>
                )}
              </h2>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 700,
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state card" style={{ padding: '2.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
                <p style={{ fontWeight: 700, color: 'var(--text-2)' }}>No notifications yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.map((notif) => {
                  const icons: Record<string, string> = {
                    order_update: '📦', booking_request: '👷',
                    review_received: '⭐', system: '🔔',
                  };
                  return (
                    <div
                      key={notif.id}
                      className="card"
                      style={{
                        padding:    '14px 18px',
                        cursor:     'pointer',
                        background: notif.is_read ? 'var(--bg-card)' : 'var(--accent-pale)',
                        borderColor:notif.is_read ? 'var(--border)' : 'var(--accent-mid)',
                        display:    'flex',
                        gap:        14,
                        alignItems: 'flex-start',
                      }}
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                        {icons[notif.notif_type] ?? '🔔'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: notif.is_read ? 500 : 700, fontSize: '0.875rem', color: 'var(--text)', marginBottom: 2 }}>
                          {notif.title}
                        </p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                          {notif.message}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                          {new Date(notif.created_at).toLocaleString('en-KE')}
                        </p>
                      </div>
                      {!notif.is_read && <div className="notif-dot" style={{ marginTop: 6 }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}