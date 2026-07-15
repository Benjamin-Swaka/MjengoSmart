// ============================================================
// MjengoSmart — Authentication Pages
// Login + Register with role selection and validation
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../App';
import type { UserRole } from '../types';

// ── Shared Layout ─────────────────────────────────────────────

function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title:    string;
  subtitle: string;
}) {
  return (
    <div style={{
      minHeight:      'calc(100vh - 64px)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem 1rem',
      background:     'var(--bg)',
    }}>
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,480px)',
        gap:                 0,
        width:               '100%',
        maxWidth:            900,
        minHeight:           560,
        borderRadius:        'var(--radius-xl)',
        overflow:            'hidden',
        boxShadow:           'var(--shadow-lg)',
        border:              '1px solid var(--border)',
      }}
        className="auth-grid"
      >
        {/* Left panel */}
        <div style={{
          background: 'linear-gradient(145deg, #1a1410, #2d1f14)',
          padding:    '3rem',
          display:    'flex',
          flexDirection:'column',
          justifyContent:'space-between',
          position:   'relative',
          overflow:   'hidden',
        }}
          className="hide-mobile"
        >
          {/* Pattern */}
          <div style={{
            position:        'absolute',
            inset:           0,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(196,92,26,0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(196,92,26,0.1) 0%, transparent 40%)
            `,
            pointerEvents:   'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
              <div style={{
                width:  36, height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #c45c1a, #e8722a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>🏗️</div>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
                MjengoSmart
              </span>
            </div>

            <h2 style={{
              fontFamily:   'var(--font-serif)',
              fontSize:     '1.8rem',
              color:        '#fff',
              fontWeight:   700,
              lineHeight:   1.3,
              marginBottom: '1rem',
            }}>
              Kenya's Construction Resource Platform
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Connecting homebuilders with verified suppliers and skilled fundis across Kenya.
            </p>
          </div>

          {/* Features */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📐', text: 'Material cost estimator with Kenyan market rates' },
              { icon: '🗺️', text: 'GIS-powered supplier discovery near your site' },
              { icon: '👷', text: 'Verified fundis with transparent reputation scores' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width:  32, height: 32, borderRadius: 8,
                  background: 'rgba(196,92,26,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', flexShrink: 0,
                }}>
                  {icon}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{
          background: 'var(--bg-card)',
          padding:    '2.5rem',
          display:    'flex',
          flexDirection:'column',
          justifyContent:'center',
        }}>
          <h1 style={{
            fontSize:     '1.5rem',
            fontWeight:   800,
            color:        'var(--text)',
            marginBottom: 6,
          }}>
            {title}
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            {subtitle}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────

export function Login() {
  const { setUser } = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/dashboard';

  const [form,    setForm]    = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username.trim()) { setError('Username is required.'); return; }
    if (!form.password)        { setError('Password is required.'); return; }

    setLoading(true);
    setError('');

    try {
      const result = await authService.login({
        username: form.username.trim(),
        password: form.password,
      });
      setUser(result.user);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setError(e.detail ?? 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your MjengoSmart account"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Username */}
        <div className="form-group">
          <label className="input-label">Username</label>
          <input
            type="text"
            name="username"
            className={`input ${error ? 'input-error' : ''}`}
            value={form.username}
            onChange={handleChange}
            placeholder="Enter your username"
            autoComplete="username"
            autoFocus
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="input-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? 'text' : 'password'}
              name="password"
              className={`input ${error ? 'input-error' : ''}`}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{
                position:  'absolute',
                right:     12,
                top:       '50%',
                transform: 'translateY(-50%)',
                background:'none',
                border:    'none',
                cursor:    'pointer',
                fontSize:  '1rem',
                color:     'var(--text-3)',
              }}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: 4 }}
          disabled={loading}
        >
          {loading ? (
            <><div style={spinStyle} /> Signing In…</>
          ) : (
            'Sign In →'
          )}
        </button>

        {/* Links */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-3)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700 }}>
            Create one free
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// ── Register ──────────────────────────────────────────────────

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'client',   label: 'Homebuilder / Client', icon: '🏠', desc: 'Order materials & hire fundis' },
  { value: 'supplier', label: 'Hardware Supplier',    icon: '🏪', desc: 'List & sell your materials'   },
  { value: 'worker',   label: 'Skilled Worker (Fundi)', icon: '👷', desc: 'Get hired for construction jobs' },
];

export function Register() {
  const { setUser } = useAuth();
  const navigate    = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    username:     '',
    email:        '',
    password:     '',
    password2:    '',
    first_name:   '',
    last_name:    '',
    role:         '' as UserRole | '',
    phone:        '',
    location_name:'',
  });

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateStep1 = (): string => {
    if (!form.role)            return 'Please select your account type.';
    if (!form.first_name.trim()) return 'First name is required.';
    if (!form.last_name.trim())  return 'Last name is required.';
    return '';
  };

  const validateStep2 = (): string => {
    if (!form.username.trim())  return 'Username is required.';
    if (form.username.length < 3) return 'Username must be at least 3 characters.';
    if (!form.email.trim())     return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address.';
    if (!form.password)         return 'Password is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.password2) return 'Passwords do not match.';
    return '';
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
      const result = await authService.register({
        username:      form.username.trim(),
        email:         form.email.trim(),
        password:      form.password,
        password2:     form.password2,
        first_name:    form.first_name.trim(),
        last_name:     form.last_name.trim(),
        role:          form.role as UserRole,
        phone:         form.phone.trim() || undefined,
        location_name: form.location_name.trim() || undefined,
      });
      setUser(result.user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const e = err as Record<string, string | string[]>;
      const firstErr = Object.values(e)
        .flat()
        .find((v) => typeof v === 'string');
      setError((firstErr as string) ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? 'Create your account' : 'Set up your profile'}
      subtitle={
        step === 1
          ? 'Choose your role to get started'
          : 'Almost done — fill in your account details'
      }
    >
      {/* Step indicator */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           8,
        marginBottom:  '1.5rem',
      }}>
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <div style={{
              width:          28,
              height:         28,
              borderRadius:   '50%',
              background:     s <= step ? 'var(--accent)' : 'var(--bg-muted)',
              border:         `2px solid ${s <= step ? 'var(--accent)' : 'var(--border)'}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '0.75rem',
              fontWeight:     700,
              color:          s <= step ? '#fff' : 'var(--text-3)',
              transition:     'all 200ms',
            }}>
              {s < step ? '✓' : s}
            </div>
            {s < 2 && (
              <div style={{
                flex:       1,
                height:     2,
                background: step > s ? 'var(--accent)' : 'var(--border)',
                borderRadius: 1,
                transition: 'background 200ms',
              }} />
            )}
          </React.Fragment>
        ))}
        <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginLeft: 8 }}>
          Step {step} of 2
        </span>
      </div>

      {/* ── Step 1: Role + Name ── */}
      {step === 1 && (
        <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Role Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="input-label">I am a… *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {ROLES.map(({ value, label, icon, desc }) => (
                <div
                  key={value}
                  onClick={() => { setForm((p) => ({ ...p, role: value })); setError(''); }}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          14,
                    padding:      '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border:       `2px solid ${form.role === value ? 'var(--accent)' : 'var(--border)'}`,
                    background:   form.role === value ? 'var(--accent-pale)' : 'var(--bg-muted)',
                    cursor:       'pointer',
                    transition:   'all 150ms',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{label}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{desc}</p>
                  </div>
                  <div style={{
                    width:        20,
                    height:       20,
                    borderRadius: '50%',
                    border:       `2px solid ${form.role === value ? 'var(--accent)' : 'var(--border)'}`,
                    background:   form.role === value ? 'var(--accent)' : 'transparent',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    flexShrink:   0,
                    transition:   'all 150ms',
                  }}>
                    {form.role === value && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '0.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="input-label">First Name *</label>
              <input
                type="text"
                name="first_name"
                className="input"
                value={form.first_name}
                onChange={handleChange}
                placeholder="e.g. James"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="input-label">Last Name *</label>
              <input
                type="text"
                name="last_name"
                className="input"
                value={form.last_name}
                onChange={handleChange}
                placeholder="e.g. Otieno"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="input-label">Phone Number (optional)</label>
            <input
              type="tel"
              name="phone"
              className="input"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 0712 345 678"
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="input-label">Your Location (optional)</label>
            <input
              type="text"
              name="location_name"
              className="input"
              value={form.location_name}
              onChange={handleChange}
              placeholder="e.g. Westlands, Nairobi"
            />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
            Continue →
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-3)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </form>
      )}

      {/* ── Step 2: Account Credentials ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Back button */}
          <button
            type="button"
            onClick={() => { setStep(1); setError(''); }}
            style={{
              display:    'inline-flex',
              alignItems: 'center',
              gap:        6,
              fontSize:   '0.82rem',
              color:      'var(--text-3)',
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              marginBottom: '1rem',
              padding:    0,
              fontFamily: 'var(--font-display)',
            }}
          >
            ← Back to Step 1
          </button>

          {/* Selected role preview */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            padding:      '10px 14px',
            background:   'var(--accent-pale)',
            borderRadius: 'var(--radius-md)',
            border:       '1px solid var(--accent-mid)',
            marginBottom: '1.25rem',
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {ROLES.find((r) => r.value === form.role)?.icon}
            </span>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Registering as</p>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent)' }}>
                {form.first_name} {form.last_name} ·{' '}
                {ROLES.find((r) => r.value === form.role)?.label}
              </p>
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="input-label">Username *</label>
            <input
              type="text"
              name="username"
              className="input"
              value={form.username}
              onChange={handleChange}
              placeholder="Choose a unique username"
              autoComplete="username"
              autoFocus
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="input-label">Email Address *</label>
            <input
              type="email"
              name="email"
              className="input"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="input-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                name="password"
                className="input"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} style={eyeStyle}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div className="progress-bar" style={{ height: 4 }}>
                  <div className="progress-fill" style={{
                    width: `${Math.min(100, form.password.length * 8)}%`,
                    background: form.password.length >= 12 ? 'var(--green)'
                              : form.password.length >= 8  ? 'var(--amber)'
                              : 'var(--red)',
                  }} />
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3 }}>
                  {form.password.length >= 12 ? 'Strong ✓'
                   : form.password.length >= 8 ? 'Good'
                   : 'Too short'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="input-label">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd2 ? 'text' : 'password'}
                name="password2"
                className={`input ${form.password2 && form.password !== form.password2 ? 'input-error' : ''}`}
                value={form.password2}
                onChange={handleChange}
                placeholder="Repeat your password"
                autoComplete="new-password"
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPwd2((v) => !v)} style={eyeStyle}>
                {showPwd2 ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password2 && form.password !== form.password2 && (
              <p className="input-error-msg">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Terms note */}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '1rem', lineHeight: 1.5 }}>
            By creating an account you agree to MjengoSmart's Terms of Service
            and Privacy Policy. Your data helps us build a trusted Kenyan
            construction community.
          </p>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <><div style={spinStyle} /> Creating Account…</>
            ) : (
              '🏗️ Create Account'
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

// ── Shared Styles ─────────────────────────────────────────────

const spinStyle: React.CSSProperties = {
  width:        16,
  height:       16,
  border:       '2px solid rgba(255,255,255,0.3)',
  borderTop:    '2px solid #fff',
  borderRadius: '50%',
  animation:    'spin 0.8s linear infinite',
  display:      'inline-block',
};

const eyeStyle: React.CSSProperties = {
  position:  'absolute',
  right:     12,
  top:       '50%',
  transform: 'translateY(-50%)',
  background:'none',
  border:    'none',
  cursor:    'pointer',
  fontSize:  '1rem',
  color:     'var(--text-3)',
};