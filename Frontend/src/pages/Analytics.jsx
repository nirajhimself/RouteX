import { useState, useEffect } from "react";
import api from "../api/api"; // ✅ central axios

const CID = 1; // ✅ change if needed

const COLORS = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#f43f5e",
];

function fmt(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetchAll();
  }, []);

  // ✅ FIXED: axios instead of fetch
  async function fetchAll() {
    setLoading(true);
    try {
      const [s, r, d] = await Promise.all([
        api.get(`/analytics/summary/${CID}`),
        api.get(`/analytics/revenue/${CID}?days=30`),
        api.get(`/analytics/drivers/${CID}`),
      ]);

      setData(s.data);
      setTrend(r.data);
      setDrivers(Array.isArray(d.data) ? d.data : []);
    } catch (e) {
      console.error("Analytics error", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div style={s.page}>
        <div style={s.loadWrap}>
          <div style={s.spin} />
          <span style={{ color: "#64748b" }}>Loading analytics…</span>
        </div>
      </div>
    );

  if (!data)
    return (
      <div style={s.page}>
        <div style={s.loadWrap}>
          <span style={{ color: "#64748b" }}>
            No data available yet. Create some bookings first.
          </span>
        </div>
      </div>
    );

  const maxRevenue = Math.max(
    ...(trend?.daily_revenue || []).map((d) => d.revenue),
    1,
  );

  const maxCity = Math.max(...(data.top_cities || []).map((c) => c.count), 1);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Analytics</h1>
          <p style={s.sub}>Real-time business intelligence</p>
        </div>
        <button onClick={fetchAll} style={s.refreshBtn}>
          ↻ Refresh
        </button>
      </div>

      {/* KPI */}
      <div style={s.kpiGrid}>
        {[
          {
            label: "Total Bookings",
            value: data.summary.total_bookings,
            color: "#60a5fa",
          },
          {
            label: "Total Revenue",
            value: fmt(data.summary.total_revenue),
            color: "#4ade80",
          },
          {
            label: "Avg Order Value",
            value: fmt(data.summary.avg_order_value),
            color: "#f97316",
          },
          {
            label: "Success Rate",
            value: `${data.summary.success_rate}%`,
            color: "#a78bfa",
          },
        ].map((k) => (
          <div key={k.label} style={s.kpiCard}>
            <div>
              <div style={{ ...s.kpiVal, color: k.color }}>{k.value}</div>
              <div style={s.kpiLabel}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {["overview", "revenue", "cities", "drivers"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Revenue tab */}
      {tab === "revenue" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Revenue</div>
          <div style={{ display: "flex", gap: 4, height: 150 }}>
            {(trend?.daily_revenue || []).map((d) => (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  background: "#3b82f6",
                  height: `${(d.revenue / maxRevenue) * 120}px`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: 20, background: "#020617", minHeight: "100vh" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { fontSize: 24, color: "#fff" },
  sub: { color: "#64748b" },
  refreshBtn: { padding: "6px 12px", cursor: "pointer" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 },
  kpiCard: { background: "#0f172a", padding: 10, borderRadius: 10 },
  kpiVal: { fontSize: 18, fontWeight: 700 },
  kpiLabel: { fontSize: 12, color: "#64748b" },
  tabs: { display: "flex", gap: 6, margin: "20px 0" },
  tab: { padding: "6px 10px", cursor: "pointer" },
  tabActive: { background: "#1e293b", color: "#fff" },
  card: { background: "#0f172a", padding: 20, borderRadius: 10 },
  cardTitle: { marginBottom: 10, color: "#fff" },
  loadWrap: { display: "flex", justifyContent: "center", marginTop: 50 },
  spin: {
    width: 20,
    height: 20,
    border: "2px solid #ccc",
    borderTop: "2px solid blue",
    borderRadius: "50%",
  },
};
