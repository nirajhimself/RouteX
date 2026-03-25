import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import API from "../config";

const STATUS_MAP = {
  Pending: { cls: "badge-pending", label: "Pending" },
  "In Transit": { cls: "badge-transit", label: "In Transit" },
  Delivered: { cls: "badge-delivered", label: "Delivered" },
  Booked: { cls: "badge-booked", label: "Booked" },
};

export default function MyTrips() {
  const { driver } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/driver/${driver.id}/shipments`);
      const data = await r.json();
      setTrips(Array.isArray(data) ? data : []);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  const filters = ["all", "Pending", "In Transit", "Delivered"];
  const filtered =
    filter === "all" ? trips : trips.filter((t) => t.status === filter);

  const stats = {
    total: trips.length,
    active: trips.filter((t) => t.status === "In Transit").length,
    pending: trips.filter((t) => t.status === "Pending").length,
    done: trips.filter((t) => t.status === "Delivered").length,
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 0", background: "#020617" }}>
        <p
          style={{
            color: "#e8001d",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Good day
        </p>
        <h1
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 32,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: -0.5,
            marginTop: 2,
          }}
        >
          {driver.name}
        </h1>
        <p style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
          ID #{driver.id} ·{" "}
          {driver.is_available ? "🟢 Available" : "🔴 On Trip"}
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
          padding: "16px 20px",
        }}
      >
        {[
          { label: "Total", value: stats.total, color: "#f0f0f0" },
          { label: "Pending", value: stats.pending, color: "#eab308" },
          { label: "Active", value: stats.active, color: "#3b82f6" },
          { label: "Done", value: stats.done, color: "#22c55e" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: "12px 8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: s.color,
                fontFamily: "'Barlow Condensed',sans-serif",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#666",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 20px 16px",
          overflowX: "auto",
        }}
      >
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? "#e8001d" : "#0f172a",
              color: filter === f ? "#fff" : "#888",
              border: filter === f ? "none" : "1px solid #1e293b",
              borderRadius: 20,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              textTransform: "capitalize",
              flexShrink: 0,
            }}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Trip list */}
      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {loading ? (
          <div className="spinner">
            <div className="spin" /> Loading trips...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🚛</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>No trips found</div>
            <div style={{ fontSize: 13, color: "#666" }}>
              Your assigned deliveries will appear here
            </div>
          </div>
        ) : (
          filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => navigate(`/trip/${trip.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TripCard({ trip, onClick }) {
  const st = STATUS_MAP[trip.status] || STATUS_MAP["Pending"];
  return (
    <div
      onClick={onClick}
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 14,
        padding: 16,
        cursor: "pointer",
        transition: "border-color 0.15s, transform 0.1s",
        active: "transform: scale(0.98)",
      }}
      onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Trip #{trip.id}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
            {trip.pickup_location || "—"}
          </div>
        </div>
        <span className={`badge ${st.cls}`}>{st.label}</span>
      </div>

      {/* Route */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#020617",
          borderRadius: 10,
          padding: "10px 12px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Pickup
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginTop: 2,
              color: "#ccc",
            }}
          >
            {trip.pickup_location || "—"}
          </div>
        </div>
        <div style={{ color: "#e8001d", fontSize: 18 }}>→</div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Drop
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginTop: 2,
              color: "#ccc",
            }}
          >
            {trip.delivery_location || "—"}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <div style={{ fontSize: 13, color: "#888" }}>⚖️ {trip.weight} kg</div>
        {trip.has_proof && (
          <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
            ✓ Proof uploaded
          </div>
        )}
        <div style={{ fontSize: 12, color: "#555" }}>
          {trip.created_at?.slice(0, 10)}
        </div>
      </div>
    </div>
  );
}
