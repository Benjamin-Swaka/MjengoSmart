// ============================================================
// MjengoSmart — Workers / Labor Directory
// Ultra‑stable version – immune to parent remounts & loops
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MapView from '../components/MapView';
import WorkerCard from '../components/WorkerCard';
import ReviewModal from '../components/ReviewModal';
import { workerService } from '../services/api';
import type { Worker, SkillType } from '../types';

// ── Constants ─────────────────────────────────────────────────
const SKILLS: SkillType[] = [
  'Mason', 'Plumber', 'Electrician', 'Carpenter',
  'Painter', 'Welder', 'Tiler', 'Roofer',
  'General Labour', 'Supervisor',
];

const SKILL_ICONS: Record<string, string> = {
  Mason: '🧱', Plumber: '🔧', Electrician: '⚡', Carpenter: '🪚',
  Painter: '🎨', Welder: '🔥', Tiler: '🟫', Roofer: '🏠',
  'General Labour': '💪', Supervisor: '📋',
};

// ── Worker Skeleton ───────────────────────────────────────────
function WorkerSkeleton() {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 16, width: '70%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 12, width: '50%', borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 12, borderRadius: 4, marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 12, width: '80%', borderRadius: 4, marginBottom: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="skeleton" style={{ height: 52, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 52, borderRadius: 8 }} />
      </div>
      <div className="skeleton" style={{ height: 38, borderRadius: 8 }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Workers() {
  // ── Data state ────────────────────────────────────────────
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── UI‑only state ──────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'rate_asc' | 'rate_desc' | 'exp'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ── Filter INPUT state ─────────────────────────────────────
  const [skillInput, setSkillInput] = useState<SkillType | ''>('');
  const [onlyAvailInput, setOnlyAvailInput] = useState(false);
  const [nearbyInput, setNearbyInput] = useState(false);

  // ── COMMITTED filter state (triggers API call) ────────────
  const [committedSkill, setCommittedSkill] = useState<SkillType | ''>('');
  const [committedOnlyAvail, setCommittedOnlyAvail] = useState(false);
  const [committedNearby, setCommittedNearby] = useState(false);

  // ── Modals ────────────────────────────────────────────────
  const [reviewWorker, setReviewWorker] = useState<Worker | null>(null);

  // ── Location stored in REFS (no re‑renders) ───────────────
  const latRef = useRef<number>(-1.2921);
  const lngRef = useRef<number>(36.8219);
  const locationFetched = useRef(false);
  const geoAbortRef = useRef<AbortController | null>(null);

  // ── Map display coords ────────────────────────────────────
  const [mapLat, setMapLat] = useState<number>(-1.2921);
  const [mapLng, setMapLng] = useState<number>(36.8219);

  // ── Fetch control ──────────────────────────────────────────
  const [workerFetchKey, setWorkerFetchKey] = useState(0);
  const fetchInProgress = useRef(false);            // ← PREVENTS CONCURRENT FETCHES
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Geolocation – runs once ───────────────────────────────
  useEffect(() => {
    if (locationFetched.current) return;
    locationFetched.current = true;

    if (!navigator.geolocation) return;

    geoAbortRef.current = new AbortController();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latRef.current = pos.coords.latitude;
        lngRef.current = pos.coords.longitude;
        setMapLat(pos.coords.latitude);
        setMapLng(pos.coords.longitude);
        setWorkerFetchKey(k => k + 1); // trigger initial fetch
      },
      () => {
        setWorkerFetchKey(k => k + 1); // use defaults
      },
      { timeout: 8000, maximumAge: 300000, signal: geoAbortRef.current.signal }
    );

    return () => geoAbortRef.current?.abort();
  }, []);

  // ── Apply filters ──────────────────────────────────────────
  const applyFilters = useCallback(() => {
    setCommittedSkill(skillInput);
    setCommittedOnlyAvail(onlyAvailInput);
    setCommittedNearby(nearbyInput);
    setWorkerFetchKey(k => k + 1);
  }, [skillInput, onlyAvailInput, nearbyInput]);

  // ── Clear all filters ─────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSkillInput('');
    setOnlyAvailInput(false);
    setNearbyInput(false);
    setSearch('');
    setCommittedSkill('');
    setCommittedOnlyAvail(false);
    setCommittedNearby(false);
    setWorkerFetchKey(k => k + 1);
  }, []);

  // ── Fetch workers (with concurrency guard) ─────────────────
  useEffect(() => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Prevent overlapping fetches
    if (fetchInProgress.current) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let cancelled = false;

    const fetchWorkers = async () => {
      fetchInProgress.current = true;
      setLoading(true);
      setError('');

      const params: {
        lat?: number;
        lng?: number;
        skill?: string;
        available?: boolean;
      } = {};

      if (committedNearby) {
        params.lat = latRef.current;
        params.lng = lngRef.current;
      }
      if (committedSkill) params.skill = committedSkill;
      if (committedOnlyAvail) params.available = true;

      try {
        const data = await workerService.getAll(params, {
          signal: abortController.signal,
        });
        if (!cancelled) {
          setWorkers(data);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (!cancelled) {
          setError('Failed to load workers. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchInProgress.current = false;
        }
      }
    };

    fetchWorkers();

    return () => {
      cancelled = true;
      abortController.abort();
      fetchInProgress.current = false;
    };
  }, [committedSkill, committedOnlyAvail, committedNearby, workerFetchKey]);

  // ── Client‑side filtering + sorting (memoized) ─────────────
  const filtered = useMemo(() => {
    return workers
      .filter(w => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          w.full_name?.toLowerCase().includes(q) ||
          w.skill_type.toLowerCase().includes(q) ||
          w.bio?.toLowerCase().includes(q) ||
          w.location_name?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'rating': return b.rating - a.rating;
          case 'rate_asc': return a.daily_rate - b.daily_rate;
          case 'rate_desc': return b.daily_rate - a.daily_rate;
          case 'exp': return b.experience_years - a.experience_years;
          default: return 0;
        }
      });
  }, [workers, search, sortBy]);

  const available = filtered.filter(w => w.is_available).length;
  const avgRating = filtered.length
    ? (filtered.reduce((s, w) => s + w.rating, 0) / filtered.length).toFixed(1)
    : '—';
  const tradeCount = new Set(filtered.map(w => w.skill_type)).size;

  const handleReviewSuccess = useCallback(() => {
    setReviewWorker(null);
    setWorkerFetchKey(k => k + 1);
  }, []);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header – unchanged */}
      <div style={{ background: 'linear-gradient(135deg, #1d4e8f 0%, #152d52 100%)', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="badge badge-blue">Objective 3</span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Reputation‑Based</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: '#fff', fontWeight: 700, marginBottom: 8 }}>
            Skilled Workers Directory
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', maxWidth: 540 }}>
            Find verified fundis — masons, plumbers, electricians, and more. Every worker carries a transparent reputation score from real clients.
          </p>
        </div>
      </div>

      {/* Skill Tabs (commits immediately) */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '10px 1.5rem', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, width: 'max-content' }}>
          <button
            className={`tab-btn ${!committedSkill ? 'active' : ''}`}
            onClick={() => {
              setSkillInput('');
              setCommittedSkill('');
              setWorkerFetchKey(k => k + 1);
            }}
            style={{ whiteSpace: 'nowrap', padding: '6px 14px' }}
          >
            All Trades
          </button>
          {SKILLS.map(s => (
            <button
              key={s}
              className={`tab-btn ${committedSkill === s ? 'active' : ''}`}
              onClick={() => {
                const newSkill = committedSkill === s ? '' : s;
                setSkillInput(newSkill);
                setCommittedSkill(newSkill);
                setWorkerFetchKey(k => k + 1);
              }}
              style={{ whiteSpace: 'nowrap', padding: '6px 14px' }}
            >
              {SKILL_ICONS[s]} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Controls */}
      <div style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)', padding: '12px 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name, trade, or location"
            style={{ flex: 2, minWidth: 200 }}
          />

          <select
            className="input"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{ flex: 1, minWidth: 160 }}
          >
            <option value="rating">⭐ Best Rated</option>
            <option value="rate_asc">💰 Rate: Low → High</option>
            <option value="rate_desc">💰 Rate: High → Low</option>
            <option value="exp">🏆 Most Experienced</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={onlyAvailInput} onChange={e => setOnlyAvailInput(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
            Available Only
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={nearbyInput} onChange={e => setNearbyInput(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
            📍 Near Me
          </label>

          <button className="btn-primary" onClick={applyFilters}>Apply Filters</button>

          {(skillInput || onlyAvailInput || nearbyInput || search) && (
            <button className="btn-ghost" onClick={clearFilters}>Clear</button>
          )}

          <div className="tabs" style={{ width: 'auto', marginLeft: 'auto' }}>
            <button className={`tab-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞ Grid</button>
            <button className={`tab-btn ${viewMode === 'map' ? 'active' : ''}`} onClick={() => setViewMode('map')}>🗺️ Map</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Stats bar */}
        {!loading && workers.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Fundis', value: filtered.length, icon: '👷', color: 'var(--blue)' },
              { label: 'Available Now', value: available, icon: '✅', color: 'var(--green)' },
              { label: 'Avg. Rating', value: avgRating, icon: '⭐', color: 'var(--amber)' },
              { label: 'Trades', value: tradeCount, icon: '🔧', color: 'var(--accent)' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', marginBottom: 3 }}>{icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>⚠️ {error}</div>}

        {viewMode === 'map' && (
          <div style={{ marginBottom: '2rem' }}>
            <MapView
              workers={filtered.filter(w => w.latitude && w.longitude)}
              userLat={mapLat}
              userLng={mapLng}
              height={440}
              onWorkerClick={w => setSelectedId(w.id)}
              selectedId={selectedId ?? undefined}
              selectedType="worker"
            />
          </div>
        )}

        {loading ? (
          <div className="grid-auto">
            {Array.from({ length: 6 }).map((_, i) => <WorkerSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👷</div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-2)', marginBottom: 6 }}>No workers found</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Try a different trade or clear the filters.</p>
            <button className="btn-ghost" onClick={clearFilters} style={{ marginTop: '1rem' }}>Clear Filters</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '1.25rem' }}>
              Showing {filtered.length} worker{filtered.length !== 1 ? 's' : ''}
              {committedSkill && ` · ${committedSkill}`}
              {committedOnlyAvail && ' · Available only'}
              {committedNearby && ' · Near you'}
            </p>
            <div className="grid-auto">
              {filtered.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onReviewClick={setReviewWorker}
                  highlighted={selectedId === worker.id}
                />
              ))}
            </div>
          </>
        )}

        {/* Reputation panel */}
        {!loading && workers.length > 0 && (
          <div className="card" style={{ marginTop: '3rem', padding: '22px 26px', background: 'var(--bg-muted)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 14 }}>🛡️ How the Reputation System Works</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { icon: '✓', title: 'Verified Identity', desc: 'Workers register with verifiable contact details.' },
                { icon: '⭐', title: 'Client Reviews', desc: 'Only clients who booked a worker can submit reviews.' },
                { icon: '📊', title: 'Live Rating Score', desc: 'Rating updates automatically after each review.' },
                { icon: '📋', title: 'Booking History', desc: 'All completed jobs are tracked as milestones.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)', marginBottom: 2 }}>{title}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {reviewWorker && (
        <ReviewModal
          targetType="worker"
          targetId={reviewWorker.id}
          targetName={reviewWorker.full_name ?? `Worker #${reviewWorker.id}`}
          onClose={() => setReviewWorker(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}