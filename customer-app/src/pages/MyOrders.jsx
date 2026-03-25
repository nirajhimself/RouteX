import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../config";
const CID = "demo-company";

export default function MyOrders() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/bookings/${CID}`);
      const data = await r.json();
      // Filter by customer if logged in
      let all = Array.isArray(data) ? data : [];
      if (customer && customer.name && customer.type !== "guest") {
        const name = customer.name.toLowerCase();
        const filtered = all.filter(
          (o) =>
            o.sender_name?.toLowerCase().includes(name) ||
            o.receiver_name?.toLowerCase().includes(name) ||
            o.client_id === customer.id,
        );
        setOrders(filtered.length > 0 ? filtered : all);
      } else {
        setOrders(all);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const statuses = ["all", "Booked", "In Transit", "Delivered", "Cancelled"];
  const filtered = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch =
      !search ||
      o.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.receiver_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusStyle = {
    Booked: "badge-booked",
    "In Transit": "badge-transit",
    Delivered: "badge-delivered",
    Cancelled: "badge-cancelled",
    Pending: "badge-pending",
  };

  return (
    <div className="container page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 32,
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            My Orders
          </h1>
          <p style={{ color: "#64748b" }}>{orders.length} total shipments</p>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <input
          className="input"
          placeholder="Search by tracking # or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: filter === s ? "#1e293b" : "none",
                color: filter === s ? "#f1f5f9" : "#64748b",
                border: "none",
                borderRadius: 7,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: filter === s ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="spinner">
          <div className="spin" />
          Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 48 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>No orders found</div>
          <div style={{ fontSize: 13 }}>Your bookings will appear here</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((order) => (
            <div
              key={order.id}
              className="card"
              style={{ cursor: "pointer", transition: "border-color 0.15s" }}
              onClick={() => navigate(`/track?number=${order.tracking_number}`)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#334155")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#1e293b")
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#60a5fa",
                      marginBottom: 2,
                    }}
                  >
                    {order.tracking_number}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {order.created_at?.slice(0, 10)}
                  </div>
                </div>
                <span
                  className={`badge ${statusStyle[order.status] || "badge-booked"}`}
                >
                  {order.status}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: 8,
                  alignItems: "center",
                  background: "#020617",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}
                  >
                    From
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}
                  >
                    {order.sender_city || "—"}
                  </div>
                </div>
                <div
                  style={{
                    color: "#e8001d",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  →
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}
                  >
                    To
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}
                  >
                    {order.receiver_city}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {order.carrier} · {order.service_type}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  ⚖️ {order.weight_kg}kg · ₹{order.carrier_rate}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
