// ============================================================
// MjengoSmart — GIS Marketplace Page
// Fixed: all infinite reload loops eliminated
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import MaterialCard from '../components/MaterialCard';
import { materialService, supplierService, geocodeService } from '../services/api';
import type { Material, Supplier, MaterialCategory } from '../types';

// ── Constants ─────────────────────────────────────────────────

const CATEGORIES: MaterialCategory[] = [
  'Cement', 'Steel', 'Timber', 'Sand', 'Roofing',
  'Tiles', 'Paint', 'Electrical', 'Plumbing', 'Other',
];

// ── Location Search ───────────────────────────────────────────

function LocationSearch({
  value,
  onChange,
  onSelect,
}: {
  value:    string;
  onChange: (v: string) => void;
  onSelect: (lat: number, lng: number) => void;
}) {
  const [results, setResults] = useState<
    { label: string; lat: number; lng: number }[]
  >([]);
  const [open,  setOpen]  = useState(false);
  const timerRef          = useRef<ReturnType<typeof setTimeout>>();

  const handleInput = (v: string) => {
    onChange(v);
    clearTimeout(timerRef.current);
    if (v.trim().length < 3) { setResults([]); setOpen(false); return; }

    timerRef.current = setTimeout(async () => {
      try {
        const hits = await geocodeService.search(v);
        const mapped = hits.slice(0, 5).map((h) => ({
          label: h.display_name,
          lat:   parseFloat(h.lat),
          lng:   parseFloat(h.lon),
        }));
        setResults(mapped);
        setOpen(mapped.length > 0);
      } catch {
        // ignore
      }
    }, 600);
  };

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <input
        className="input"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        placeholder="📍 Location (e.g. Westlands, Nairobi)"
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div style={{
          position:     'absolute',
          top:          'calc(100% + 4px)',
          left:         0,
          right:        0,
          background:   'var(--bg-card)',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow:    'var(--shadow-md)',
          zIndex:       50,
          overflow:     'hidden',
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onSelect(r.lat, r.lng);
                onChange(r.label);
                setOpen(false);
              }}
              style={{
                display:      'block',
                width:        '100%',
                textAlign:    'left',
                padding:      '10px 14px',
                fontSize:     '0.82rem',
                color:        'var(--text-2)',
                background:   'none',
                border:       'none',
                borderBottom: i < results.length - 1
                  ? '1px solid var(--border)'
                  : 'none',
                cursor:    'pointer',
                fontFamily:'var(--font-display)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--bg-muted)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'none';
              }}
            >
              📍 {r.label.length > 65 ? r.label.slice(0, 65) + '…' : r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function Marketplace() {
  const navigate = useNavigate();

  // ── Data state ────────────────────────────────────────────
  const [materials,        setMaterials]        = useState<Material[]>([]);
  const [suppliers,        setSuppliers]        = useState<Supplier[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // ── UI state ──────────────────────────────────────────────
  const [viewMode,     setViewMode]     = useState<'grid' | 'map'>('grid');
  const [showFilters,  setShowFilters]  = useState(false);
  const [sortBy,       setSortBy]       = useState('price_asc');
  const [locationQ,    setLocationQ]    = useState('');

  // ── Filter INPUT state (what user types — not yet committed) ──
  const [searchInput,   setSearchInput]   = useState('');
  const [categoryInput, setCategoryInput] = useState<MaterialCategory | ''>('');
  const [maxPriceInput, setMaxPriceInput] = useState('');

  // ── COMMITTED filter state (triggers API call when changed) ──
  const [committedSearch,   setCommittedSearch]   = useState('');
  const [committedCategory, setCommittedCategory] = useState<MaterialCategory | ''>('');
  const [committedMaxPrice, setCommittedMaxPrice] = useState('');

  // ── Location stored in REFS to avoid triggering re-renders ──
  // This is the key fix — location does NOT live in state
  const latRef = useRef<number>(-1.2921); // Nairobi default
  const lngRef = useRef<number>(36.8219);
  const locationSetRef = useRef(false);   // track if geolocation ran

  // ── User-selected location (only changes when user picks one) ──
  const [manualLat, setManualLat] = useState<number | undefined>();
  const [manualLng, setManualLng] = useState<number | undefined>();

  // ── Fetch counter — increment to trigger a re-fetch ──────────
  // This avoids putting functions or objects in useEffect deps
  const [materialFetchKey, setMaterialFetchKey] = useState(0);
  const [supplierFetchKey, setSupplierFetchKey] = useState(0);

  // ── Get geolocation ONCE, store in ref ───────────────────────
  useEffect(() => {
    if (locationSetRef.current) return; // already ran
    locationSetRef.current = true;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Store in ref — does NOT cause re-render
        latRef.current = pos.coords.latitude;
        lngRef.current = pos.coords.longitude;
        // Trigger one supplier fetch with real location
        setSupplierFetchKey((k) => k + 1);
      },
      () => {
        // Keep Nairobi default — already set in ref
        setSupplierFetchKey((k) => k + 1);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []); // runs exactly once

  // ── Fetch materials when committed filters change ─────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    materialService
      .getAll({
        category:  committedCategory || undefined,
        max_price: committedMaxPrice ? Number(committedMaxPrice) : undefined,
        search:    committedSearch.trim() || undefined,
      })
      .then((data) => {
        if (!cancelled) setMaterials(data);
      })
      .catch(() => {
        if (!cancelled)
          setError('Failed to load materials. Please check your connection.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedCategory, committedMaxPrice, committedSearch, materialFetchKey]);
  // ↑ Only primitive strings + a counter — no objects, no functions

  // ── Fetch suppliers when location is ready ────────────────────
  useEffect(() => {
    if (supplierFetchKey === 0) return; // wait for geolocation attempt

    let cancelled = false;

    const lat = manualLat ?? latRef.current;
    const lng = manualLng ?? lngRef.current;

    supplierService
      .getAll({ lat, lng })
      .then((data) => {
        if (!cancelled) setSuppliers(data);
      })
      .catch(() => {
        // suppliers are optional — don't show error
      });

    return () => { cancelled = true; };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierFetchKey, manualLat, manualLng]);
  // ↑ supplierFetchKey is a number, manualLat/Lng are number|undefined — all primitives

  // ── Sort (pure — no side effects) ────────────────────────────
  const sortedMaterials = [...materials].sort((a, b) => {
    if (sortBy === 'price_asc')  return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'name_asc')   return a.name.localeCompare(b.name);
    return 0;
  });

  // ── Handlers ─────────────────────────────────────────────────

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCommittedSearch(searchInput);
    setCommittedCategory(categoryInput);
    setCommittedMaxPrice(maxPriceInput);
  };

  const handleCategoryTab = (cat: MaterialCategory | '') => {
    setCategoryInput(cat);
    setCommittedCategory(cat);
    // reset other filters
    setCommittedSearch('');
    setCommittedMaxPrice('');
  };

  const clearFilters = () => {
    setSearchInput('');
    setCategoryInput('');
    setMaxPriceInput('');
    setCommittedSearch('');
    setCommittedCategory('');
    setCommittedMaxPrice('');
    setSortBy('price_asc');
  };

  const handleOrderSuccess = () => {
    // Re-fetch materials by bumping the key
    setMaterialFetchKey((k) => k + 1);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setManualLat(lat);
    setManualLng(lng);
    setSupplierFetchKey((k) => k + 1);
  };

  const activeFilters = [
    committedCategory && `Category: ${committedCategory}`,
    committedMaxPrice && `Max: KES ${Number(committedMaxPrice).toLocaleString()}`,
    committedSearch   && `"${committedSearch}"`,
  ].filter(Boolean) as string[];

  // Display location for the map
  const displayLat = manualLat ?? latRef.current;
  const displayLng = manualLng ?? lngRef.current;

  // ── Render ───────────────────────────────────────────────────

  return (
    <div
      className="page-enter"
      style={{ minHeight: '100vh', background: 'var(--bg)' }}
    >
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--text) 0%, #2d1f14 100%)',
        padding:    '2.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        10,
            marginBottom: 8,
          }}>
            <span className="badge badge-accent">Objective 2</span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
              GIS-Powered
            </span>
          </div>
          <h1 style={{
            fontFamily:   'var(--font-serif)',
            fontSize:     'clamp(1.6rem, 4vw, 2.4rem)',
            color:        '#fff',
            fontWeight:   700,
            marginBottom: 8,
          }}>
            Materials Marketplace
          </h1>
          <p style={{
            color:    'rgba(255,255,255,0.65)',
            fontSize: '0.95rem',
            maxWidth: 540,
          }}>
            Browse real-time material prices from verified suppliers near you.
            Switch to Map view to discover hardware stores on the GIS map.
          </p>
        </div>
      </div>

      {/* ── Sticky Search Bar ── */}
      <div style={{
        background:   'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding:      '1rem 1.5rem',
        position:     'sticky',
        top:          64,
        zIndex:       90,
        boxShadow:    'var(--shadow-sm)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Search input */}
              <input
                className="input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="🔍 Search materials (cement, iron sheets, timber…)"
                style={{ flex: 2, minWidth: 200 }}
              />

              {/* Category select */}
              <select
                className="input"
                value={categoryInput}
                onChange={(e) =>
                  setCategoryInput(e.target.value as MaterialCategory | '')
                }
                style={{ flex: 1, minWidth: 140 }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ flex: 1, minWidth: 160 }}
              >
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name_asc">Name: A → Z</option>
              </select>

              {/* More filters toggle */}
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowFilters((v) => !v)}
              >
                ⚙️ {showFilters ? 'Less' : 'More'}
              </button>

              {/* Search submit */}
              <button type="submit" className="btn-primary">
                🔍 Search
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap:                 10,
                marginTop:           10,
                padding:             '14px',
                background:          'var(--bg-muted)',
                borderRadius:        'var(--radius-md)',
                border:              '1px solid var(--border)',
              }}>
                <div>
                  <label className="input-label">Max Price (KES)</label>
                  <input
                    type="number"
                    className="input"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    placeholder="e.g. 5000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="input-label">📍 Search Location</label>
                  <LocationSearch
                    value={locationQ}
                    onChange={setLocationQ}
                    onSelect={handleLocationSelect}
                  />
                </div>
              </div>
            )}
          </form>

          {/* Result count + filter pills + view toggle */}
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        8,
            marginTop:  8,
            flexWrap:   'wrap',
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
              {loading
                ? 'Loading…'
                : `${sortedMaterials.length} material${
                    sortedMaterials.length !== 1 ? 's' : ''
                  } found`}
            </span>

            {activeFilters.map((f) => (
              <span
                key={f}
                className="badge badge-accent"
                style={{ fontSize: '0.72rem' }}
              >
                {f}
              </span>
            ))}

            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  fontSize:   '0.75rem',
                  color:      'var(--red)',
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  fontFamily: 'var(--font-display)',
                  fontWeight:  600,
                }}
              >
                ✕ Clear all
              </button>
            )}

            {/* View toggle — pushed to right */}
            <div className="tabs" style={{ marginLeft: 'auto', width: 'auto' }}>
              <button
                className={`tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                ⊞ Grid
              </button>
              <button
                className={`tab-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
              >
                🗺️ Map
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Quick Tabs ── */}
      <div style={{
        background:   'var(--bg-muted)',
        borderBottom: '1px solid var(--border)',
        padding:      '10px 1.5rem',
        overflowX:    'auto',
      }}>
        <div style={{
          maxWidth: 1200,
          margin:   '0 auto',
          display:  'flex',
          gap:      8,
          width:    'max-content',
        }}>
          <button
            className={`tab-btn ${!committedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryTab('')}
            style={{ whiteSpace: 'nowrap', padding: '6px 14px' }}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`tab-btn ${committedCategory === cat ? 'active' : ''}`}
              onClick={() =>
                handleCategoryTab(cat === committedCategory ? '' : cat)
              }
              style={{ whiteSpace: 'nowrap', padding: '6px 14px' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Error */}
        {error && (
          <div
            className="alert alert-error"
            style={{ marginBottom: '1.5rem' }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Map View ── */}
        {viewMode === 'map' && (
          <div style={{ marginBottom: '2rem' }}>
            <MapView
              suppliers={suppliers}
              userLat={displayLat}
              userLng={displayLng}
              height={460}
              onSupplierClick={setSelectedSupplier}
              selectedId={selectedSupplier?.id}
              selectedType="supplier"
            />

            {/* Selected supplier info strip */}
            {selectedSupplier && (
              <div
                className="card"
                style={{
                  marginTop:  '1rem',
                  padding:    '14px 18px',
                  display:    'flex',
                  alignItems: 'center',
                  gap:        16,
                  flexWrap:   'wrap',
                  animation:  'pageEnter 0.2s ease',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        8,
                    marginBottom: 4,
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>🏪</span>
                    <h3 style={{
                      fontWeight: 700,
                      fontSize:   '0.95rem',
                      color:      'var(--text)',
                    }}>
                      {selectedSupplier.business_name}
                    </h3>
                    <span
                      className={`badge ${
                        selectedSupplier.is_open_now
                          ? 'badge-green'
                          : 'badge-red'
                      }`}
                    >
                      {selectedSupplier.is_open_now ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
                    📍 {selectedSupplier.address}
                    {selectedSupplier.distance_km !== undefined && (
                      <span style={{
                        color:      'var(--accent)',
                        fontWeight: 600,
                        marginLeft: 8,
                      }}>
                        · {selectedSupplier.distance_km.toFixed(1)} km away
                      </span>
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-ghost"
                    style={{ padding: '8px 14px', fontSize: '0.875rem' }}
                    onClick={() => setSelectedSupplier(null)}
                  >
                    ✕
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                    onClick={() =>
                      navigate(`/suppliers/${selectedSupplier.id}`)
                    }
                  >
                    View Supplier →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Loading Spinner ── */}
        {loading && (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="spinner" />
            <p style={{
              color:     'var(--text-3)',
              marginTop: '1rem',
              fontSize:  '0.875rem',
            }}>
              Loading materials…
            </p>
          </div>
        )}

        {/* ── Material Grid ── */}
        {!loading && (
          sortedMaterials.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
                📦
              </div>
              <h3 style={{
                fontWeight:   700,
                fontSize:     '1.1rem',
                color:        'var(--text-2)',
                marginBottom: 6,
              }}>
                No materials found
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>
                Try adjusting your search or clearing the filters.
              </p>
              <button
                className="btn-ghost"
                onClick={clearFilters}
                style={{ marginTop: '1rem' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid-auto">
              {sortedMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onOrderSuccess={handleOrderSuccess}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}