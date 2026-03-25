import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const CID = "demo-company";

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

  async function fetchAll() {
    setLoading(true);
    try {
      const [s, r, d] = await Promise.all([
        fetch(`${API}/analytics/summary/${CID}`).then((r) => r.json()),
        fetch(`${API}/analytics/revenue/${CID}?days=30`).then((r) => r.json()),
        fetch(`${API}/analytics/drivers/${CID}`).then((r) => r.json()),
      ]);
      setData(s);
      setTrend(r);
      setDrivers(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
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

      {/* Summary KPIs */}
      <div style={s.kpiGrid}>
        {[
          {
            label: "Total Bookings",
            value: data.summary.total_bookings,
            color: "#60a5fa",
            icon: "📦",
          },
          {
            label: "Total Revenue",
            value: fmt(data.summary.total_revenue),
            color: "#4ade80",
            icon: "💰",
          },
          {
            label: "Avg Order Value",
            value: fmt(data.summary.avg_order_value),
            color: "#f97316",
            icon: "📊",
          },
          {
            label: "Success Rate",
            value: `${data.summary.success_rate}%`,
            color: "#a78bfa",
            icon: "✅",
          },
          {
            label: "Total Shipments",
            value: data.summary.total_shipments,
            color: "#38bdf8",
            icon: "🚛",
          },
        ].map((k) => (
          <div key={k.label} style={s.kpiCard}>
            <span style={{ fontSize: 22 }}>{k.icon}</span>
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
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div style={s.grid2}>
          {/* Carrier revenue */}
          <div style={s.card}>
            <div style={s.cardTitle}>Revenue by Carrier</div>
            {(data.revenue_by_carrier || []).length === 0 ? (
              <div style={s.empty}>No carrier data yet</div>
            ) : (
              (data.revenue_by_carrier || []).map((c, i) => (
                <div key={c.carrier} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e2e8f0",
                      }}
                    >
                      {c.carrier}
                    </span>
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>
                      {fmt(c.revenue)} · {c.count} bookings
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "#1e293b",
                      borderRadius: 3,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        background: COLORS[i % COLORS.length],
                        width: `${Math.min(100, (c.revenue / (data.revenue_by_carrier[0]?.revenue || 1)) * 100)}%`,
                        transition: "width 0.6s",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Booking status */}
          <div style={s.card}>
            <div style={s.cardTitle}>Booking Status</div>
            {(data.booking_status || []).length === 0 ? (
              <div style={s.empty}>No booking data yet</div>
            ) : (
              (data.booking_status || []).map((b, i) => (
                <div
                  key={b.status}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #1e293b",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                    <span style={{ fontSize: 14, color: "#e2e8f0" }}>
                      {b.status}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: COLORS[i % COLORS.length],
                    }}
                  >
                    {b.count}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Weight distribution */}
          <div style={s.card}>
            <div style={s.cardTitle}>Weight Distribution</div>
            {(data.weight_distribution || []).length === 0 ? (
              <div style={s.empty}>No weight data yet</div>
            ) : (
              (data.weight_distribution || []).map((w, i) => (
                <div key={w.range} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>
                      {w.range}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e2e8f0",
                      }}
                    >
                      {w.count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "#1e293b",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 4,
                        background: COLORS[i % COLORS.length],
                        width: `${w.count === 0 ? 2 : Math.max(4, (w.count / Math.max(...(data.weight_distribution || []).map((x) => x.count), 1)) * 100)}%`,
                        transition: "width 0.6s",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Shipment status */}
          <div style={s.card}>
            <div style={s.cardTitle}>Shipment Status</div>
            {(data.shipment_status || []).length === 0 ? (
              <div style={s.empty}>No shipment data yet</div>
            ) : (
              (data.shipment_status || []).map((b, i) => (
                <div
                  key={b.status}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #1e293b",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                    <span style={{ fontSize: 14, color: "#e2e8f0" }}>
                      {b.status}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: COLORS[i % COLORS.length],
                    }}
                  >
                    {b.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "revenue" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Daily Revenue — Last 30 Days</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Total: {fmt(trend?.total)}
          </div>
          {!trend?.daily_revenue || trend.daily_revenue.length === 0 ? (
            <div style={s.empty}>
              No revenue data yet. Create some bookings!
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 3,
                height: 160,
                padding: "0 4px",
              }}
            >
              {trend.daily_revenue.map((d, i) => (
                <div
                  key={d.date}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    title={`${d.date}: ${fmt(d.revenue)}`}
                    style={{
                      width: "100%",
                      background: "#3b82f6",
                      borderRadius: "3px 3px 0 0",
                      height: `${Math.max(4, (d.revenue / maxRevenue) * 130)}px`,
                      transition: "height 0.4s",
                      opacity: d.revenue === 0 ? 0.2 : 1,
                    }}
                  />
                  {i % 7 === 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        color: "#475569",
                        whiteSpace: "nowrap",
                        transform: "rotate(-40deg)",
                        transformOrigin: "top center",
                      }}
                    >
                      {d.date.slice(5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "cities" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Top Delivery Cities</div>
          {(data.top_cities || []).length === 0 ? (
            <div style={s.empty}>No city data yet</div>
          ) : (
            (data.top_cities || []).map((c, i) => (
              <div key={c.city} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#94a3b8",
                        width: 20,
                        textAlign: "right",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#e2e8f0",
                      }}
                    >
                      {c.city}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: COLORS[i % COLORS.length],
                    }}
                  >
                    {c.count} deliveries
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "#1e293b",
                    borderRadius: 4,
                    marginLeft: 28,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      background: COLORS[i % COLORS.length],
                      width: `${(c.count / maxCity) * 100}%`,
                      transition: "width 0.6s",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "drivers" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Driver Performance</div>
          {drivers.length === 0 ? (
            <div style={s.empty}>No driver data yet</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "Driver",
                      "Trips",
                      "Delivered",
                      "Pending",
                      "Success Rate",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          borderBottom: "1px solid #1e293b",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => (
                    <tr
                      key={d.driver_id}
                      style={{ borderBottom: "1px solid #0f172a" }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#e2e8f0",
                        }}
                      >
                        {d.name}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: 14,
                          color: "#94a3b8",
                        }}
                      >
                        {d.total_trips}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: 14,
                          color: "#4ade80",
                          fontWeight: 600,
                        }}
                      >
                        {d.delivered}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: 14,
                          color: "#fbbf24",
                        }}
                      >
                        {d.pending}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 60,
                              height: 6,
                              background: "#1e293b",
                              borderRadius: 3,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 3,
                                background:
                                  d.success_rate >= 80
                                    ? "#4ade80"
                                    : d.success_rate >= 50
                                      ? "#fbbf24"
                                      : "#f87171",
                                width: `${d.success_rate}%`,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 13, color: "#94a3b8" }}>
                            {d.success_rate}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            background: d.is_available ? "#052e16" : "#1c0a0a",
                            color: d.is_available ? "#4ade80" : "#f87171",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {d.is_available ? "Available" : "On Trip"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    padding: "28px 32px",
    background: "#020617",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    margin: "0 0 4px",
    fontSize: 26,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
  },
  sub: { margin: 0, color: "#64748b", fontSize: 14 },
  refreshBtn: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 13,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  kpiVal: { fontSize: 20, fontWeight: 700, lineHeight: 1 },
  kpiLabel: { color: "#64748b", fontSize: 12, marginTop: 4 },
  tabs: {
    display: "flex",
    gap: 4,
    background: "#0f172a",
    padding: 4,
    borderRadius: 10,
    border: "1px solid #1e293b",
    marginBottom: 20,
    width: "fit-content",
  },
  tab: {
    background: "none",
    border: "none",
    color: "#64748b",
    padding: "7px 18px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.15s",
  },
  tabActive: { background: "#1e293b", color: "#e2e8f0", fontWeight: 600 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#f1f5f9",
    marginBottom: 16,
  },
  empty: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    padding: "32px 0",
  },
  loadWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: "60vh",
  },
  spin: {
    width: 20,
    height: 20,
    border: "2px solid #1e293b",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};
