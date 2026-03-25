import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000";

export default function Earnings() {
  const { driver } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/driver/${driver.id}/shipments`)
      .then((r) => r.json())
      .then((d) => {
        setTrips(Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const delivered = trips.filter((t) => t.status === "Delivered");
  const pending = trips.filter((t) => t.status === "Pending");
  const inTransit = trips.filter((t) => t.status === "In Transit");

  // Mock earnings — ₹150 per delivery
  const perTrip = 150;
  const totalEarned = delivered.length * perTrip;
  const thisMonth =
    delivered.filter((t) => {
      const d = new Date(t.created_at);
      const n = new Date();
      return (
        d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
      );
    }).length * perTrip;

  if (loading)
    return (
      <div className="spinner" style={{ paddingTop: 120 }}>
        <div className="spin" />
        Loading...
      </div>
    );

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 16px" }}>
        <p
          style={{
            color: "#e8001d",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Overview
        </p>
        <h1
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 32,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: -0.5,
          }}
        >
          Earnings
        </h1>
      </div>

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Total earned big card */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 16,
            padding: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              background: "#e8001d",
              borderRadius: "50%",
              opacity: 0.06,
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: "#888",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Total Earned
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 52,
              fontWeight: 800,
              color: "#e8001d",
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            ₹{totalEarned.toLocaleString("en-IN")}
          </div>
          <div style={{ color: "#555", fontSize: 13, marginTop: 8 }}>
            {delivered.length} deliveries completed
          </div>
        </div>

        {/* Stats grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {[
            {
              label: "This Month",
              value: `₹${thisMonth.toLocaleString("en-IN")}`,
              color: "#22c55e",
              icon: "📅",
            },
            {
              label: "Per Delivery",
              value: `₹${perTrip}`,
              color: "#3b82f6",
              icon: "📦",
            },
            {
              label: "In Transit",
              value: inTransit.length,
              color: "#eab308",
              icon: "🚛",
            },
            {
              label: "Pending Trips",
              value: pending.length,
              color: "#f97316",
              icon: "⏳",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: 26,
                  fontWeight: 800,
                  color: s.color,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 12,
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

        {/* Recent deliveries */}
        <div>
          <div
            style={{
              fontSize: 12,
              color: "#555",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Completed Trips
          </div>
          {delivered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💰</div>
              <div style={{ fontWeight: 700 }}>No completed trips yet</div>
              <div style={{ fontSize: 13, color: "#666" }}>
                Complete deliveries to see your earnings
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {delivered.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      Trip #{t.id}
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                      {t.delivery_location} · {t.created_at?.slice(0, 10)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed',sans-serif",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#22c55e",
                    }}
                  >
                    +₹{perTrip}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
