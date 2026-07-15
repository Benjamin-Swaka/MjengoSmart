// ============================================================
// MjengoSmart — Navigation Bar
// Responsive navbar with notification bell, auth state,
// mobile hamburger menu, and role-aware links
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { notificationService } from '../services/api';
import type { Notification } from '../types';

// ── Icon Components ───────────────────────────────────────────

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6"  />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6"  x2="6"  y2="18" />
    <line x1="6"  y1="6"  x2="18" y2="18" />
  </svg>
);

const BellIcon = ({ hasUnread }: { hasUnread: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: hasUnread ? 'var(--accent)' : 'var(--text-2)' }}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

// ── Nav Links Config ─────────────────────────────────────────

interface NavLink {
  label: string;
  to: string;
  icon: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home',        to: '/',            icon: '🏠' },
  { label: 'Marketplace', to: '/marketplace', icon: '🏪' },
  { label: 'Workers',     to: '/workers',     icon: '👷' },
  { label: 'Estimator',   to: '/estimator',   icon: '📐' },
];

// ── Notification Panel ────────────────────────────────────────

interface NotifPanelProps {
  notifications: Notification[];
  onMarkAll: () => void;
  onMarkOne: (id: number) => void;
  onClose: () => void;
}

function NotificationPanel({
  notifications,
  onMarkAll,
  onMarkOne,
  onClose,
}: NotifPanelProps) {
  const unread = notifications.filter((n) => !n.is_read);

  const typeIcon: Record<string, string> = {
    order_update:    '📦',
    booking_request: '👷',
    review_received: '⭐',
    system:          '🔔',
  };

  const typeColor: Record<string, string> = {
    order_update:    'var(--blue)',
    booking_request: 'var(--green)',
    review_received: 'var(--amber)',
    system:          'var(--accent)',
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
            Notifications
          </p>
          {unread.length > 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
              {unread.length} unread
            </p>
          )}
        </div>
        {unread.length > 0 && (
          <button
            onClick={onMarkAll}
            style={{
              fontSize: '0.78rem',
              color: 'var(--accent)',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
            <p style={{ fontSize: '0.875rem' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onMarkOne(notif.id)}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                cursor: 'pointer',
                background: notif.is_read ? 'transparent' : 'var(--accent-pale)',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => {
                if (notif.is_read)
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-muted)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  notif.is_read ? 'transparent' : 'var(--accent-pale)';
              }}
            >
              {/* Icon */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--bg-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0,
                border: `2px solid ${typeColor[notif.notif_type] ?? 'var(--border)'}22`,
              }}>
                {typeIcon[notif.notif_type] ?? '🔔'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontWeight: notif.is_read ? 500 : 700,
                  fontSize: '0.875rem',
                  color: 'var(--text)',
                  marginBottom: 2,
                }}>
                  {notif.title}
                </p>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-3)',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {notif.message}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                  {formatTimeAgo(notif.created_at)}
                </p>
              </div>

              {/* Unread dot */}
              {!notif.is_read && (
                <div className="notif-dot" style={{ marginTop: 6 }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <Link
          to="/dashboard"
          onClick={onClose}
          style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}
        >
          View all in Dashboard →
        </Link>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 12px)',
  right: 0,
  width: '360px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  zIndex: 200,
  animation: 'pageEnter 0.2s ease',
};

// ── Helpers ───────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins  <  1)  return 'Just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  <  7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function getInitials(user: { first_name?: string; last_name?: string; username?: string }): string {
  if (user.first_name && user.last_name)
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  return 'U';
}

// ── Main Navbar Component ─────────────────────────────────────

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scrolled,      setScrolled]      = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const userRef    = useRef<HTMLDivElement>(null);

  // ── Scroll shadow ──────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Close mobile menu on route change ─────────────────────

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // ── Fetch notifications ────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Click outside to close dropdowns ──────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Notification handlers ──────────────────────────────────

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const handleMarkOne = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch { /* ignore */ }
  };

  // ── Logout ─────────────────────────────────────────────────

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(248,245,240,0.96)' : 'var(--bg)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        transition: 'all 200ms ease',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 1.5rem',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          {/* ── Brand ── */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              boxShadow: '0 2px 8px rgba(196,92,26,0.35)',
            }}>
              🏗️
            </div>
            <div>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                fontSize: '1.2rem',
                color: 'var(--accent)',
                letterSpacing: '-0.01em',
              }}>
                Mjengo
              </span>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                fontSize: '1.2rem',
                color: 'var(--text)',
              }}>
                Smart
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            justifyContent: 'center',
          }}
            className="hide-mobile"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: isActive(link.to) ? 700 : 500,
                  color: isActive(link.to) ? 'var(--accent)' : 'var(--text-2)',
                  background: isActive(link.to) ? 'var(--accent-pale)' : 'transparent',
                  transition: 'all 150ms',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.to)) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-muted)';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.to)) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-2)';
                  }
                }}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right Section ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {user ? (
              <>
                {/* Notification Bell */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      setNotifOpen((o) => !o);
                      setUserMenuOpen(false);
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: notifOpen ? 'var(--accent-pale)' : 'transparent',
                      border: '1.5px solid',
                      borderColor: notifOpen ? 'var(--accent)' : 'var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 150ms',
                    }}
                    aria-label="Notifications"
                  >
                    <BellIcon hasUnread={unreadCount > 0} />
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: 'var(--red)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--bg)',
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <NotificationPanel
                      notifications={notifications}
                      onMarkAll={handleMarkAll}
                      onMarkOne={handleMarkOne}
                      onClose={() => setNotifOpen(false)}
                    />
                  )}
                </div>

                {/* User Menu */}
                <div ref={userRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      setUserMenuOpen((o) => !o);
                      setNotifOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px 6px 6px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid',
                      borderColor: userMenuOpen ? 'var(--accent)' : 'var(--border)',
                      background: userMenuOpen ? 'var(--accent-pale)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {getInitials(user)}
                    </div>

                    <span
                      className="hide-mobile"
                      style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}
                    >
                      {user.first_name || user.username}
                    </span>
                    <span className="hide-mobile" style={{ color: 'var(--text-3)' }}>
                      <ChevronDown />
                    </span>
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: 220,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 200,
                      overflow: 'hidden',
                      animation: 'pageEnter 0.15s ease',
                    }}>
                      {/* User Info */}
                      <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-muted)',
                      }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>
                          {user.first_name} {user.last_name}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
                          {user.email}
                        </p>
                        <span className={`badge badge-${
                          user.role === 'supplier' ? 'blue' :
                          user.role === 'worker'   ? 'green' :
                          user.role === 'admin'    ? 'accent' : 'muted'
                        }`} style={{ marginTop: 6 }}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </div>

                      {/* Links */}
                      <div style={{ padding: '6px' }}>
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          style={dropdownItemStyle}
                        >
                          <DashboardIcon />
                          Dashboard
                        </Link>

                        <button
                          onClick={handleLogout}
                          style={{ ...dropdownItemStyle, width: '100%', color: 'var(--red)' }}
                        >
                          <LogoutIcon />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest Buttons */
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link to="/login" className="btn-ghost"
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              className="show-mobile"
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-2)',
                cursor: 'pointer',
              }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)',
            padding: '12px',
            animation: 'pageEnter 0.2s ease',
          }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: isActive(link.to) ? 700 : 500,
                  color: isActive(link.to) ? 'var(--accent)' : 'var(--text-2)',
                  background: isActive(link.to) ? 'var(--accent-pale)' : 'transparent',
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}

            <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 500,
                      color: 'var(--text-2)',
                    }}
                  >
                    <DashboardIcon />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 500,
                      color: 'var(--red)',
                      width: '100%',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <LogoutIcon />
                    Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/login"    className="btn-ghost"   style={{ justifyContent: 'center' }}>Sign In</Link>
                  <Link to="/register" className="btn-primary" style={{ justifyContent: 'center' }}>Get Started</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text-2)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  fontFamily: 'var(--font-display)',
  width: '100%',
  textAlign: 'left',
  transition: 'background 150ms',
};