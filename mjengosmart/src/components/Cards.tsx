import { Star, MapPin, Package, Wrench } from "lucide-react";
import type { Supplier, Material, Worker } from "@/types";

// ─── Supplier Card ────────────────────────────────────────────────
export function SupplierCard({ supplier }: { supplier: Supplier }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "20px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 style={{ fontWeight: 600, fontSize: "1rem", color: "var(--color-text)" }}>
          {supplier.business_name}
        </h3>
        <div className="flex items-center gap-1">
          <Star size={13} fill="var(--color-accent)" color="var(--color-accent)" />
          <span style={{ fontSize: "0.8rem", color: "var(--color-accent)", fontWeight: 600 }}>
            {supplier.rating?.toFixed(1) ?? "N/A"}
          </span>
        </div>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", marginBottom: "12px", lineHeight: 1.5 }}>
        {supplier.description}
      </p>
      <div className="flex items-center gap-1">
        <MapPin size={13} color="var(--color-muted)" />
        <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>{supplier.address}</span>
      </div>
      {supplier.distance !== undefined && (
        <div
          style={{
            marginTop: "10px",
            background: "var(--color-accent-muted)",
            borderRadius: "6px",
            padding: "4px 10px",
            display: "inline-block",
          }}
        >
          <span style={{ fontSize: "0.78rem", color: "var(--color-accent)", fontWeight: 500 }}>
            {(supplier.distance / 1000).toFixed(1)} km away
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Material Card ────────────────────────────────────────────────
export function MaterialCard({ material }: { material: Material }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      <div style={{ height: "120px", background: "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {material.image ? (
          <img src={material.image} alt={material.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Package size={32} color="var(--color-muted)" />
        )}
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
          <h3 style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.95rem" }}>{material.name}</h3>
          <span
            style={{
              fontSize: "0.75rem",
              background: "var(--color-border)",
              color: "var(--color-muted)",
              padding: "2px 8px",
              borderRadius: "99px",
              whiteSpace: "nowrap",
            }}
          >
            {material.category}
          </span>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--color-muted)", marginBottom: "12px" }}>
          {material.description}
        </p>
        <div className="flex items-center justify-between">
          <span style={{ fontWeight: 700, color: "var(--color-accent)", fontSize: "1rem" }}>
            KES {Number(material.price).toLocaleString()}/{material.unit}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
            Stock: {material.stock_quantity}
          </span>
        </div>
        {material.supplier_name && (
          <p style={{ fontSize: "0.78rem", color: "var(--color-muted)", marginTop: "8px" }}>
            by {material.supplier_name}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Worker Card ──────────────────────────────────────────────────
export function WorkerCard({ worker }: { worker: Worker }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "20px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--color-accent-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wrench size={18} color="var(--color-accent)" />
        </div>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-text)" }}>
            {worker.full_name ?? "Worker"}
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
            {worker.specialization ?? worker.skill_type ?? "General Labour"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Star size={13} fill="var(--color-accent)" color="var(--color-accent)" />
          <span style={{ fontSize: "0.8rem", color: "var(--color-accent)", fontWeight: 600 }}>
            {worker.rating?.toFixed(1) ?? "N/A"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontWeight: 700, color: "var(--color-accent)", fontSize: "0.95rem" }}>
          KES {Number(worker.daily_rate).toLocaleString()}/day
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
          {worker.experience_years} yrs exp
        </span>
      </div>
      {worker.is_available !== undefined && (
        <div
          style={{
            marginTop: "10px",
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: "99px",
            fontSize: "0.75rem",
            fontWeight: 500,
            background: worker.is_available ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            color: worker.is_available ? "#22c55e" : "#ef4444",
          }}
        >
          {worker.is_available ? "Available" : "Unavailable"}
        </div>
      )}
    </div>
  );
}