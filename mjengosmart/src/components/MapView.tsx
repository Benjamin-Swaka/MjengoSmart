// ============================================================
// MjengoSmart — Interactive GIS Map Component
// Uses Leaflet + OpenStreetMap (no API key required)
// Supports supplier pins, worker pins, user location
// ============================================================

import React, { useEffect, useRef, useMemo } from 'react';
import type { Supplier, Worker } from '../types';

// ── Types ─────────────────────────────────────────────────────

interface MapPin {
  id: number;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  type: 'supplier' | 'worker' | 'user';
  rating?: number;
  distance_km?: number;
}

interface MapViewProps {
  suppliers?: Supplier[];
  workers?: Worker[];
  userLat?: number;
  userLng?: number;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  height?: string | number;
  onSupplierClick?: (supplier: Supplier) => void;
  onWorkerClick?: (worker: Worker) => void;
  selectedId?: number | null;
  selectedType?: 'supplier' | 'worker';
  className?: string;
}

// ── Pin Colors ────────────────────────────────────────────────

const PIN_COLORS = {
  supplier: '#c45c1a',
  worker:   '#1d4e8f',
  user:     '#2d6a4f',
};

// ── SVG Marker Generator ─────────────────────────────────────

function createMarkerSVG(color: string, emoji: string, selected = false): string {
  const size   = selected ? 44 : 36;
  const border = selected ? 4  : 2.5;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
      </filter>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - border / 2}"
        fill="${selected ? '#fff' : color}"
        stroke="${selected ? color : '#fff'}"
        stroke-width="${border}"
        filter="url(#shadow)"
      />
      <text x="${size / 2}" y="${size / 2 + 5}" 
        text-anchor="middle" font-size="${selected ? 18 : 14}">
        ${emoji}
      </text>
      <polygon 
        points="${size / 2 - 5},${size - 2} ${size / 2 + 5},${size - 2} ${size / 2},${size + 6}"
        fill="${selected ? color : color}"
      />
    </svg>
  `;
}

// ── Leaflet Loader (dynamic import to avoid SSR issues) ───────

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

let leafletLoaded = false;
let leafletPromise: Promise<typeof import('leaflet')> | null = null;

async function loadLeaflet(): Promise<typeof import('leaflet')> {
  if (window.L) return window.L;

  if (!leafletLoaded && !leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const css = document.createElement('link');
        css.rel  = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      // Load JS
      const script   = document.createElement('script');
      script.src     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload  = () => { leafletLoaded = true; resolve(window.L); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return leafletPromise!;
}

// ── Main Component ────────────────────────────────────────────

export default function MapView({
  suppliers = [],
  workers   = [],
  userLat,
  userLng,
  centerLat,
  centerLng,
  zoom      = 12,
  height    = 420,
  onSupplierClick,
  onWorkerClick,
  selectedId,
  selectedType,
  className,
}: MapViewProps) {
  const mapRef       = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<import('leaflet').Map | null>(null);
  const markersRef   = useRef<import('leaflet').Marker[]>([]);
  const initRef      = useRef(false);

  // Build pin list
  const pins = useMemo<MapPin[]>(() => {
    const result: MapPin[] = [];

    suppliers.forEach((s) => {
      if (s.latitude && s.longitude) {
        result.push({
          id:          s.id,
          lat:         s.latitude,
          lng:         s.longitude,
          label:       s.business_name,
          sublabel:    s.address,
          type:        'supplier',
          rating:      s.rating,
          distance_km: s.distance_km,
        });
      }
    });

    workers.forEach((w) => {
      if (w.latitude && w.longitude) {
        result.push({
          id:          w.id,
          lat:         w.latitude,
          lng:         w.longitude,
          label:       w.full_name ?? `Worker #${w.id}`,
          sublabel:    w.skill_type,
          type:        'worker',
          rating:      w.rating,
          distance_km: w.distance_km,
        });
      }
    });

    return result;
  }, [suppliers, workers]);

  // Determine map center
  const mapCenter = useMemo((): [number, number] => {
    if (centerLat && centerLng) return [centerLat, centerLng];
    if (userLat   && userLng)   return [userLat,   userLng];
    if (pins.length > 0)        return [pins[0].lat, pins[0].lng];
    return [-1.2921, 36.8219]; // Nairobi default
  }, [centerLat, centerLng, userLat, userLng, pins]);

  // Initialise map
  useEffect(() => {
    if (!mapRef.current || initRef.current) return;

    let map: import('leaflet').Map;

    loadLeaflet().then((L) => {
      if (!mapRef.current || initRef.current) return;
      initRef.current = true;

      map = L.map(mapRef.current, {
        center:    mapCenter,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // OpenStreetMap tile layer (free, no API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      renderMarkers(L, map);

      // User location pin
      if (userLat && userLng) {
        const svg  = createMarkerSVG(PIN_COLORS.user, '📍', false);
        const icon = L.divIcon({
          html:      svg,
          iconSize:  [36, 44],
          iconAnchor:[18, 44],
          className: '',
        });

        L.marker([userLat, userLng], { icon })
          .addTo(map)
          .bindPopup('<strong>Your location</strong>', { maxWidth: 200 });

        // Draw radius circle (5km)
        L.circle([userLat, userLng], {
          radius:      5000,
          color:       'var(--accent)',
          fillColor:   'var(--accent)',
          fillOpacity: 0.05,
          weight:      1.5,
          dashArray:   '6,4',
        }).addTo(map);
      }
    });

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
        initRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    renderMarkers(window.L, map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, selectedId, selectedType]);

  function renderMarkers(L: typeof import('leaflet'), map: import('leaflet').Map) {
    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    pins.forEach((pin) => {
      const isSelected = selectedId === pin.id && selectedType === pin.type;
      const emoji      = pin.type === 'supplier' ? '🏪' : '👷';
      const svg        = createMarkerSVG(PIN_COLORS[pin.type], emoji, isSelected);

      const icon = L.divIcon({
        html:        svg,
        iconSize:    isSelected ? [44, 52] : [36, 44],
        iconAnchor:  isSelected ? [22, 52] : [18, 44],
        popupAnchor: [0, -44],
        className:   '',
      });

      const ratingStars = pin.rating
        ? '★'.repeat(Math.round(pin.rating)) + '☆'.repeat(5 - Math.round(pin.rating))
        : '';

      const popupContent = `
        <div style="
          font-family: 'Outfit', sans-serif;
          min-width: 180px;
          max-width: 220px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          ">
            <span style="font-size:1.2rem">${emoji}</span>
            <strong style="font-size:0.9rem;color:#1a1410;line-height:1.3">
              ${pin.label}
            </strong>
          </div>
          ${pin.sublabel ? `
            <p style="font-size:0.78rem;color:#8c7b6e;margin-bottom:6px">
              ${pin.sublabel}
            </p>` : ''}
          ${ratingStars ? `
            <div style="
              color:#b45309;
              font-size:0.8rem;
              margin-bottom:4px;
              letter-spacing:1px
            ">
              ${ratingStars}
              <span style="color:#8c7b6e;font-size:0.75rem;margin-left:4px">
                ${pin.rating?.toFixed(1)}
              </span>
            </div>` : ''}
          ${pin.distance_km !== undefined ? `
            <p style="
              font-size:0.75rem;
              color:#c45c1a;
              font-weight:600
            ">
              📍 ${pin.distance_km.toFixed(1)} km away
            </p>` : ''}
          <button
            onclick="window.mjengoMapClick('${pin.type}',${pin.id})"
            style="
              margin-top:8px;
              padding:6px 14px;
              background:#c45c1a;
              color:#fff;
              border:none;
              border-radius:6px;
              font-size:0.8rem;
              font-weight:600;
              cursor:pointer;
              font-family:'Outfit',sans-serif;
              width:100%
            "
          >
            View Details →
          </button>
        </div>
      `;

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent, {
          maxWidth:  240,
          className: 'mjengo-popup',
        });

      markersRef.current.push(marker);
    });

    // Global click handler for popup buttons
    (window as unknown as Record<string, unknown>).mjengoMapClick = (
      type: string,
      id: number
    ) => {
      if (type === 'supplier' && onSupplierClick) {
        const supplier = suppliers.find((s) => s.id === id);
        if (supplier) onSupplierClick(supplier);
      }
      if (type === 'worker' && onWorkerClick) {
        const worker = workers.find((w) => w.id === id);
        if (worker) onWorkerClick(worker);
      }
    };
  }

  return (
    <div
      className={`map-container ${className ?? ''}`}
      style={{ position: 'relative', height }}
    >
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      {(suppliers.length > 0 || workers.length > 0) && (
        <div style={{
          position:     'absolute',
          bottom:       12,
          left:         12,
          background:   'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-md)',
          padding:      '8px 12px',
          boxShadow:    'var(--shadow-md)',
          border:       '1px solid var(--border)',
          zIndex:       500,
          display:      'flex',
          flexDirection:'column',
          gap:          4,
        }}>
          {suppliers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIN_COLORS.supplier }} />
              <span>Suppliers ({suppliers.length})</span>
            </div>
          )}
          {workers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIN_COLORS.worker }} />
              <span>Workers ({workers.length})</span>
            </div>
          )}
          {userLat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIN_COLORS.user }} />
              <span>Your location</span>
            </div>
          )}
        </div>
      )}

      {/* Loading overlay when no pins */}
      {pins.length === 0 && (
        <div style={{
          position:     'absolute',
          top:          0, left: 0, right: 0, bottom: 0,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          background:   'rgba(248,245,240,0.7)',
          zIndex:       400,
          flexDirection:'column',
          gap:          8,
        }}>
          <div style={{ fontSize: '2rem' }}>🗺️</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', fontWeight: 600 }}>
            No locations to display
          </p>
        </div>
      )}
    </div>
  );
}