import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const CID = "demo-company";

export default function HeatMap() {
  const [data, setData] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cities");
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapObj = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data && tab === "map" && !mapObj.current) initMap();
  }, [data, tab]);

  async function fetchData() {
    setLoading(true);
    try {
      const [h, r] = await Promise.all([
        fetch(`${API}/heatmap/data/${CID}`).then((r) => r.json()),
        fetch(`${API}/heatmap/routes/${CID}`).then((r) => r.json()),
      ]);
      setData(h);
      setRoutes(r?.routes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function initMap() {
    if (!window.L || !mapRef.current || mapObj.current) return;
    const map = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Plot delivery points as circles
    (data?.points || []).forEach((pt) => {
      const radius = Math.min(20000, 5000 + pt.weight * 2000);
      window.L.circle([pt.lat, pt.lng], {
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.15,
        radius,
        weight: 1,
      })
        .addTo(map)
        .bindPopup(`<b>${pt.city}</b><br>${pt.weight} deliveries`);
    });

    // City markers
    (data?.city_summary || []).forEach((city) => {
      const pt = data.points.find((p) => p.city === city.city);
      if (!pt) return;
      window.L.circleMarker([pt.lat, pt.lng], {
        radius: Math.min(18, 6 + city.weight * 0.5),
        color: "#f97316",
        fillColor: "#f97316",
        fillOpacity: 0.8,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`<b>${city.city}</b><br>${city.weight} deliveries`);
    });

    mapObj.current = map;
    setMapReady(true);
  }

  const maxWeight = Math.max(
    ...(data?.city_summary || []).map((c) => c.weight),
    1,
  );

  if (loading)
    return (
      <div style={s.page}>
        <div style={s.loadWrap}>
          <div style={s.spin} />
          <span style={{ color: "#64748b" }}>Loading heatmap data…</span>
        </div>
      </div>
    );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Heatmap</h1>
          <p style={s.sub}>
            Delivery density across India ·
            {data?.has_real_data
              ? " Real data"
              : " Sample data (add bookings for real data)"}
          </p>
        </div>
        <button onClick={fetchData} style={s.refreshBtn}>
          ↻ Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div style={s.statsRow}>
        {[
          {
            label: "Total Points",
            value: data?.total_points || 0,
            color: "#60a5fa",
          },
          {
            label: "Cities Covered",
            value: data?.city_summary?.length || 0,
            color: "#f97316",
          },
          {
            label: "Top City",
            value: data?.city_summary?.[0]?.city || "—",
            color: "#4ade80",
          },
          { label: "Route Flows", value: routes.length, color: "#a78bfa" },
        ].map((st) => (
          <div key={st.label} style={s.statCard}>
            <div style={{ ...s.statVal, color: st.color }}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {["cities", "routes", "map"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === "map") setTimeout(initMap, 100);
            }}
            style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Cities tab */}
      {tab === "cities" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Delivery Density by City</div>
          {(data?.city_summary || []).length === 0 ? (
            <div style={s.empty}>
              No delivery data yet. Create bookings to see heatmap.
            </div>
          ) : (
            (data.city_summary || []).map((city, i) => (
              <div key={city.city} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 800,
                        background:
                          i === 0
                            ? "#ef4444"
                            : i === 1
                              ? "#f97316"
                              : i === 2
                                ? "#eab308"
                                : "#1e293b",
                        color: i < 3 ? "#fff" : "#94a3b8",
                      }}
                    >
                      {i + 1}
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#e2e8f0",
                      }}
                    >
                      {city.city}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                      {city.weight} deliveries
                    </span>
                    {i === 0 && (
                      <span
                        style={{
                          background: "#1c0a00",
                          color: "#f97316",
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        🔥 TOP
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{ height: 8, background: "#0f172a", borderRadius: 4 }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      transition: "width 0.8s",
                      background:
                        i === 0
                          ? "linear-gradient(90deg,#ef4444,#f97316)"
                          : i === 1
                            ? "linear-gradient(90deg,#f97316,#eab308)"
                            : "#3b82f6",
                      width: `${Math.max(4, (city.weight / maxWeight) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Routes tab */}
      {tab === "routes" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Top Route Flows</div>
          {routes.length === 0 ? (
            <div style={s.empty}>
              No route data yet. Create bookings with different cities to see
              flows.
            </div>
          ) : (
            routes.map((r, i) => (
              <div
                key={r.route}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom: "1px solid #0f172a",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#e2e8f0",
                      }}
                    >
                      {r.origin} <span style={{ color: "#f97316" }}>→</span>{" "}
                      {r.destination}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#475569", marginTop: 2 }}
                    >
                      📍 {r.origin_lat?.toFixed(2)}, {r.origin_lng?.toFixed(2)}{" "}
                      → {r.dest_lat?.toFixed(2)}, {r.dest_lng?.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa" }}
                  >
                    {r.count}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569" }}>trips</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Map tab */}
      {tab === "map" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Live Delivery Map</div>
          {/* Leaflet CSS */}
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />
          <div
            ref={mapRef}
            style={{
              height: 440,
              borderRadius: 10,
              overflow: "hidden",
              background: "#0f172a",
            }}
          >
            {!mapReady && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#475569",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={s.spin} />
                <span style={{ fontSize: 13 }}>Loading map…</span>
              </div>
            )}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "#475569",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Circle size = delivery volume · Orange dots = city centres
          </p>
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
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "16px 20px",
  },
  statVal: { fontSize: 22, fontWeight: 700, lineHeight: 1, marginBottom: 4 },
  statLabel: { color: "#64748b", fontSize: 12 },
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
    padding: "40px 0",
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
    borderTopColor: "#ef4444",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
};
