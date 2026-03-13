import { useState, useEffect, useCallback } from "react";
import { routeService } from "../services/routeService";
import { shipmentService } from "../services/shipmentService";
import { driverService } from "../services/driverService";
import { COMPANY_ID } from "../config";
import { PageLoader, ErrorState } from "../components/Loader";
import { motion } from "framer-motion";
import {
  CpuChipIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ✅ Map string values to numbers for backend
const TRAFFIC_MAP = { light: 1, moderate: 2, heavy: 3 };
const WEATHER_MAP = { clear: 1, rain: 2, fog: 3, storm: 4 };

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-500 rounded-lg p-2.5 text-xs font-mono shadow-xl">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [delayForm, setDelayForm] = useState({
    distance: "",
    traffic: "moderate",
    weather: "clear",
  });
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, dRes] = await Promise.all([
        shipmentService.getAll(COMPANY_ID),
        driverService.getAll(COMPANY_ID),
      ]);
      const sList = Array.isArray(sRes.data)
        ? sRes.data
        : (sRes.data?.shipments ?? sRes.data?.data ?? []);
      const dList = Array.isArray(dRes.data)
        ? dRes.data
        : (dRes.data?.drivers ?? dRes.data?.data ?? []);
      setShipments(sList);
      setDrivers(dList);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to load analytics",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePredict = async () => {
    if (!delayForm.distance) {
      setPredError("Distance is required");
      return;
    }
    setPredLoading(true);
    setPredError("");
    setPrediction(null);
    try {
      // ✅ Convert strings to numbers before sending to backend
      const payload = {
        distance: parseFloat(delayForm.distance),
        traffic: TRAFFIC_MAP[delayForm.traffic] || 2, // "moderate" → 2
        vehicle_type: WEATHER_MAP[delayForm.weather] || 1, // weather mapped to vehicle_type field
      };
      const res = await routeService.predictDelay(payload);
      setPrediction(res.data);
    } catch (err) {
      setPredError(
        err?.response?.data?.detail ||
          err.message ||
          "Prediction failed. Is the backend running?",
      );
    } finally {
      setPredLoading(false);
    }
  };

  if (loading) return <PageLoader label="Loading analytics…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  // Build charts from real data
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDay = Array(7).fill(0);
  const delayByDay = Array(7).fill(0);
  shipments.forEach((s) => {
    const d = s.created_at || s.date;
    if (d) {
      const day = new Date(d).getDay();
      byDay[day]++;
      if ((s.status || "").toLowerCase().includes("delay")) delayByDay[day]++;
    }
  });
  const weeklyChart = DAYS.map((day, i) => ({
    day,
    onTime: byDay[i] - delayByDay[i],
    delays: delayByDay[i],
  }));

  const byMonth = {};
  shipments.forEach((s) => {
    const d = s.created_at || s.date;
    if (d) {
      const key = new Date(d).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      byMonth[key] = (byMonth[key] || 0) + 1;
    }
  });
  const monthlyChart = Object.entries(byMonth).map(([m, v]) => ({
    m,
    count: v,
  }));

  const total = shipments.length;
  const delivered = shipments.filter((s) =>
    (s.status || "").toLowerCase().includes("deliver"),
  ).length;
  const delayed = shipments.filter((s) =>
    (s.status || "").toLowerCase().includes("delay"),
  ).length;
  const onTimeRate =
    total > 0 ? (((total - delayed) / total) * 100).toFixed(1) : "—";

  const riskColor = { High: "#f87171", Medium: "#fbbf24", Low: "#4ade80" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Operations Analytics</h1>
          <p className="section-sub">
            // live from database · {total} total shipments
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["On-Time Rate", `${onTimeRate}%`, "#4ade80"],
          ["Total Shipments", total, "#60a5fa"],
          ["Delivered", delivered, "#4ade80"],
          ["Delayed", delayed, "#f87171"],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-4">
            <p
              className="text-2xl font-bold leading-none mb-1"
              style={{ fontFamily: "Syne,sans-serif", color: c }}
            >
              {v}
            </p>
            <p className="text-xs text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      {weeklyChart.some((d) => d.onTime > 0 || d.delays > 0) && (
        <div className="card p-5">
          <h3
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Weekly Delivery Performance
          </h3>
          <p className="font-mono text-[10px] text-slate-600 mb-4">
            on-time vs delayed
          </p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={weeklyChart} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{
                  fontSize: 10,
                  fill: "#475569",
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "#475569",
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<DarkTooltip />} />
              <Bar
                dataKey="onTime"
                name="On Time"
                radius={[3, 3, 0, 0]}
                barSize={18}
                fill="#1f3a28"
              />
              <Bar
                dataKey="delays"
                name="Delayed"
                radius={[3, 3, 0, 0]}
                barSize={18}
                fill="#e8001d"
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly chart */}
      {monthlyChart.length > 1 && (
        <div className="card p-5">
          <h3
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Shipment Volume Over Time
          </h3>
          <p className="font-mono text-[10px] text-slate-600 mb-4">
            monthly shipment count
          </p>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={monthlyChart}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8001d" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#e8001d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,.04)"
                vertical={false}
              />
              <XAxis
                dataKey="m"
                tick={{
                  fontSize: 10,
                  fill: "#475569",
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "#475569",
                  fontFamily: "monospace",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<DarkTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#e8001d"
                strokeWidth={2}
                fill="url(#rg)"
                name="Shipments"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Delay Predictor */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center">
              <CpuChipIcon className="w-5 h-5 text-brand-red" />
            </div>
            <div>
              <h2
                className="font-semibold"
                style={{ fontFamily: "Syne,sans-serif" }}
              >
                AI Delay Predictor
              </h2>
              <p className="font-mono text-[10px] text-slate-600">
                POST /predict-delay → your backend
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {predError && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                {predError}
              </div>
            )}
            <div>
              <label className="label">Distance (km) *</label>
              <input
                type="number"
                placeholder="e.g. 842"
                value={delayForm.distance}
                onChange={(e) =>
                  setDelayForm((f) => ({ ...f, distance: e.target.value }))
                }
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Traffic</label>
                <select
                  className="select"
                  value={delayForm.traffic}
                  onChange={(e) =>
                    setDelayForm((f) => ({ ...f, traffic: e.target.value }))
                  }
                >
                  <option value="light">🟢 Light</option>
                  <option value="moderate">🟡 Moderate</option>
                  <option value="heavy">🔴 Heavy</option>
                </select>
              </div>
              <div>
                <label className="label">Weather</label>
                <select
                  className="select"
                  value={delayForm.weather}
                  onChange={(e) =>
                    setDelayForm((f) => ({ ...f, weather: e.target.value }))
                  }
                >
                  <option value="clear">☀️ Clear</option>
                  <option value="rain">🌧 Rain</option>
                  <option value="fog">🌫 Fog</option>
                  <option value="storm">⛈ Storm</option>
                </select>
              </div>
            </div>
            <button
              onClick={handlePredict}
              disabled={predLoading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {predLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <BoltIcon className="w-4 h-4" />
                  Predict Delay
                </span>
              )}
            </button>
          </div>
        </div>

        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-5">
              <ExclamationTriangleIcon
                className="w-5 h-5"
                style={{ color: riskColor[prediction.risk_level] || "#94a3b8" }}
              />
              <h2
                className="font-semibold"
                style={{ fontFamily: "Syne,sans-serif" }}
              >
                Prediction Results
              </h2>
              <span className="ml-auto font-mono text-[10px] text-slate-600">
                from your AI model
              </span>
            </div>

            {prediction.predicted_delay != null && (
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-40 h-20">
                  <svg viewBox="0 0 160 80" className="w-full">
                    <path
                      d="M 10 80 A 70 70 0 0 1 150 80"
                      stroke="#1f2a3c"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 80 A 70 70 0 0 1 150 80"
                      stroke={riskColor[prediction.risk_level] || "#94a3b8"}
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min(prediction.confidence || 80, 100) * 2.2} 220`}
                      style={{
                        filter: `drop-shadow(0 0 8px ${riskColor[prediction.risk_level] || "#94a3b8"}60)`,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                    <span
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: "Syne,sans-serif",
                        color: riskColor[prediction.risk_level] || "#94a3b8",
                      }}
                    >
                      {prediction.predicted_delay}m
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Predicted delay
                  {prediction.confidence
                    ? ` · ${prediction.confidence}% confidence`
                    : ""}
                </p>
              </div>
            )}

            {prediction.risk_level && (
              <div className="flex justify-center mb-5">
                <span
                  className="badge text-sm px-4 py-1.5"
                  style={{
                    background: `${riskColor[prediction.risk_level]}12`,
                    color: riskColor[prediction.risk_level],
                    borderColor: `${riskColor[prediction.risk_level]}25`,
                  }}
                >
                  {prediction.risk_level} Risk
                </span>
              </div>
            )}

            {prediction.suggestions?.length > 0 && (
              <div className="mt-auto space-y-2">
                <p className="label">AI Recommendations</p>
                {prediction.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-dark-700 rounded-lg px-3 py-2.5 border border-dark-600"
                  >
                    <span className="text-brand-red mt-0.5">→</span>
                    <p className="text-xs text-slate-300">{s}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Raw fallback */}
            {!prediction.predicted_delay && !prediction.risk_level && (
              <div className="space-y-2">
                <p className="label">Raw Response</p>
                <pre className="text-xs text-slate-400 bg-dark-700 rounded-lg p-4 overflow-auto max-h-48 font-mono">
                  {JSON.stringify(prediction, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
