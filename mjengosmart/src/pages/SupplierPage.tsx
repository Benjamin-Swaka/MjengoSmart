import { useEffect, useState } from "react";
import { MapPin, SlidersHorizontal, Star, Phone, Clock } from "lucide-react";
import { supplierService } from "@/services/api";
import { SupplierCard } from "@/components/Cards";
import MapView, { MapMarker } from "@/components/MapView";
import type { Supplier } from "@/types";
import { Link } from "react-router-dom";

const RADIUS_OPTIONS = [
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "25 km", value: 25000 },
  { label: "50 km", value: 50000 },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(25000);
  const [locating, setLocating] = useState(false);

  const load = (lat?: number, lng?: number, r?: number) => {
    setLoading(true);
    supplierService
      .getAll(lat, lng)
      .then((res: any) => {
        const features = res.data?.features ?? [];
        setSuppliers(features.map((f: any) => ({
          ...f.properties,
          id: f.properties?.id,
          geometry: f.geometry,
        })));
      })
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGeolocate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation([lat, lng]);
        load(lat, lng, radius);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const markers: MapMarker[] = suppliers
    .filter((s) => s.geometry?.coordinates)
    .map((s) => ({
      id: s.id,
      lat: s.geometry!.coordinates[1],
      lng: s.geometry!.coordinates[0],
      label: s.business_name,
      sublabel: s.address,
      rating: s.rating,
      phone: (s as any).phone,
      opening_hours: (s as any).opening_hours,
      is_open_now: (s as any).is_open_now,
      linkTo: `/suppliers/${s.id}`,
    }));

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)" }}>Supplier Map</h1>
          <p style={{ color: "var(--color-muted)", marginTop: "4px" }}>
            {suppliers.length} verified suppliers found
            {userLocation ? ` within ${radius / 1000} km of you` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Radius selector */}
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => { setRadius(r.value); if (userLocation) load(userLocation[0], userLocation[1], r.value); }}
              style={{
                padding: "7px 14px", borderRadius: "8px", fontSize: "0.82rem", fontFamily: "var(--font-display)",
                border: `1px solid ${radius === r.value ? "var(--color-accent)" : "var(--color-border)"}`,
                background: radius === r.value ? "var(--color-accent-muted)" : "transparent",
                color: radius === r.value ? "var(--color-accent)" : "var(--color-muted)",
                cursor: "pointer",
              }}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={handleGeolocate}
            disabled={locating}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--color-accent)", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.875rem", opacity: locating ? 0.7 : 1 }}
          >
            <MapPin size={14} /> {locating ? "Locating…" : "Use My Location"}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ marginBottom: "28px" }}>
        <MapView
          markers={markers}
          userLocation={userLocation ?? undefined}
          center={userLocation ?? [-1.2921, 36.8219]}
          radius={userLocation ? radius : undefined}
          height="420px"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-muted)" }}>Loading suppliers…</div>
      ) : suppliers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-muted)" }}>
          No suppliers found. Try increasing the radius or adding data via Django admin.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <Link key={s.id} to={`/suppliers/${s.id}`} style={{ textDecoration: "none" }}>
              <SupplierCard supplier={s} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}