import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { supplierService } from "@/services/api";
import { SupplierCard } from "@/components/Cards";
import MapView from "@/components/MapView";
import type { Supplier } from "@/types";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocation, setUseLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadSuppliers = (lat?: number, lng?: number) => {
    setLoading(true);
    supplierService
      .getAll(lat, lng)
      .then((r) => setSuppliers(r.data.features ?? []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleGeolocate = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setCoords({ lat, lng });
      setUseLocation(true);
      loadSuppliers(lat, lng);
    });
  };

  const markers = suppliers
    .filter((s) => s.geometry?.coordinates)
    .map((s) => ({
      id: s.id,
      lat: s.geometry!.coordinates[1],
      lng: s.geometry!.coordinates[0],
      label: s.business_name,
      sublabel: s.address,
    }));

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)" }}>Suppliers</h1>
          <p style={{ color: "var(--color-muted)", marginTop: "4px" }}>Find verified material suppliers near you</p>
        </div>
        <button
          onClick={handleGeolocate}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--color-accent)", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          <MapPin size={15} /> Use My Location
        </button>
      </div>

      {/* Map */}
      <div style={{ marginBottom: "32px" }}>
        <MapView markers={markers} center={coords ? [coords.lat, coords.lng] : undefined} height="350px" />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-muted)" }}>Loading suppliers…</div>
      ) : suppliers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-muted)" }}>No suppliers found. Add some via Django admin.</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {suppliers.map((s) => <SupplierCard key={s.id} supplier={s} />)}
        </div>
      )}
    </div>
  );
}