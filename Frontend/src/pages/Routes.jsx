import { useState } from "react";
import { routeService } from "../services/routeService";
import { motion, AnimatePresence } from "framer-motion";
import MapView from "../components/MapView";
import PlaceSearch from "../components/PlaceSearch";
import {
  MapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  TruckIcon,
  BoltIcon,
  CpuChipIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { COMPANY_ID } from "../config";
import api from "../api/api";

const STOP_COLORS = [
  "#e8001d",
  "#f97316",
  "#fbbf24",
  "#4ade80",
  "#22d3ee",
  "#818cf8",
  "#e879f9",
  "#fb7185",
];

const PRIORITY_OPTIONS = [
  {
    value: "time",
    label: "⚡ Fastest",
    color: "#60a5fa",
    desc: "Minimum travel time",
  },
  {
    value: "cost",
    label: "💰 Cheapest",
    color: "#4ade80",
    desc: "Minimum fuel + toll",
  },
  {
    value: "eco",
    label: "🌿 Eco",
    color: "#a3e635",
    desc: "Minimum CO₂ emission",
  },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div className="card p-3 text-center">
    <p className="text-base mb-0.5">{icon}</p>
    <p
      className="font-bold text-sm leading-none"
      style={{ fontFamily: "Syne,sans-serif", color }}
    >
      {value || "—"}
    </p>
    <p className="text-[9px] text-slate-600 font-mono mt-1">{label}</p>
  </div>
);

// ─── Stop input row ───────────────────────────────────────────────────────────
function StopInput({ index, stop, onChange, onRemove, canRemove }) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-7 text-[11px] font-bold text-white"
        style={{ background: STOP_COLORS[index % STOP_COLORS.length] }}
      >
        {index + 1}
      </div>
      <div className="flex-1">
        <PlaceSearch
          label={index === 0 ? "Origin / Depot *" : `Stop ${index + 1}`}
          placeholder={
            index === 0
              ? "e.g. Mumbai Warehouse"
              : `e.g. Delivery city ${index + 1}`
          }
          value={stop.name}
          onChange={(val) => onChange(index, { ...stop, name: val })}
        />
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(index)}
          className="mt-7 p-2 rounded-lg border border-dark-500 text-slate-600 hover:text-red-400 hover:border-red-400/30 transition-all"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Routes() {
  const [stops, setStops] = useState([
    { name: "", lat: null, lng: null },
    { name: "", lat: null, lng: null },
  ]);
  const [vehicleType, setVehicleType] = useState("Heavy Truck");
  const [priority, setPriority] = useState("time");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === priority);

  // ─── Geocode stop name → { lat, lng } ──────────────────────────────────────
  const geocodeStop = async (name) => {
    if (!name) return null;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ", India")}&format=json&limit=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "RouteX-App" } },
      );
      const data = await res.json();
      if (data.length > 0)
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      return null;
    } catch {
      return null;
    }
  };

  const handleStopChange = (index, updated) =>
    setStops((prev) => prev.map((s, i) => (i === index ? updated : s)));

  const addStop = () => {
    if (stops.length >= 8) return;
    setStops((prev) => [...prev, { name: "", lat: null, lng: null }]);
  };

  const removeStop = (index) =>
    setStops((prev) => prev.filter((_, i) => i !== index));

  // ─── Run optimization ───────────────────────────────────────────────────────
  const handleOptimize = async () => {
    const filled = stops.filter((s) => s.name.trim());
    if (filled.length < 2) {
      setError("Add at least 2 stops");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCompleted(false);

    try {
      // Geocode all stops in parallel
      const geocoded = await Promise.all(
        filled.map(async (stop) => {
          const coords = await geocodeStop(stop.name);
          return coords
            ? { name: stop.name, lat: coords.lat, lng: coords.lng }
            : null;
        }),
      );

      const validStops = geocoded.filter(Boolean);
      if (validStops.length < 2) {
        setError(
          "Could not locate stops. Try more specific city names (e.g. 'Mumbai, Maharashtra').",
        );
        setLoading(false);
        return;
      }

      // Call real VRP optimization backend
      const res = await api.post("/optimize-multi-stop", {
        company_id: COMPANY_ID,
        stops: validStops,
        vehicle_type: vehicleType,
        priority,
      });

      setResult(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Optimization failed. Is the backend running?",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!result?.route_id) return;
    try {
      await routeService.completeTrip(result.route_id);
    } catch {}
    setCompleted(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Route Intelligence</h1>
          <p className="section-sub">
            // Nearest Neighbor + 2-Opt · OSRM Distance Matrix · real road
            optimization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── LEFT: Form ────────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center">
              <CpuChipIcon className="w-5 h-5 text-brand-red" />
            </div>
            <div>
              <h2
                className="font-semibold"
                style={{ fontFamily: "Syne,sans-serif" }}
              >
                Multi-Stop Optimizer
              </h2>
              <p className="font-mono text-[10px] text-slate-600">
                up to 8 stops · AI finds optimal delivery order
              </p>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/25 rounded-lg text-xs text-red-400 mb-4">
              {error}
            </div>
          )}

          {/* Stop inputs */}
          <div className="space-y-1 mb-3">
            {stops.map((stop, i) => (
              <StopInput
                key={i}
                index={i}
                stop={stop}
                onChange={handleStopChange}
                onRemove={removeStop}
                canRemove={stops.length > 2}
              />
            ))}
          </div>

          {/* Add stop button */}
          {stops.length < 8 && (
            <button
              onClick={addStop}
              className="w-full py-2 rounded-xl border border-dashed border-dark-500 text-slate-600 hover:text-slate-400 hover:border-dark-400 transition-all text-xs flex items-center justify-center gap-2 mb-4"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add Stop ({stops.length}/8)
            </button>
          )}

          {/* Vehicle + Priority */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Vehicle Type</label>
              <select
                className="select"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                {[
                  "Heavy Truck",
                  "Medium Truck",
                  "Light Truck",
                  "Cargo Van",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Optimize For</label>
              <select
                className="select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading}
            className="btn-primary w-full justify-center py-3 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Running VRP optimization…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5" />
                Optimize Route
              </span>
            )}
          </button>

          {/* Algorithm explainer */}
          <div className="mt-4 px-3 py-3 rounded-xl bg-dark-800 border border-dark-600">
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-2">
              How it works
            </p>
            <div className="space-y-1.5">
              {[
                [
                  "1. OSRM Table API",
                  "Gets real road distances between ALL stop pairs",
                ],
                ["2. Nearest Neighbor", "Builds initial route greedily O(n²)"],
                ["3. 2-Opt Swap", "Removes path crossings → 90-95% optimal"],
              ].map(([step, desc]) => (
                <div key={step} className="flex items-start gap-2">
                  <span className="text-brand-red text-[10px] font-mono flex-shrink-0">
                    {step}
                  </span>
                  <span className="text-[10px] text-slate-600">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Result ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="card p-6 flex flex-col gap-5"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2
                    className="font-semibold"
                    style={{ fontFamily: "Syne,sans-serif" }}
                  >
                    Optimized Route
                  </h2>
                  <p className="font-mono text-[10px] text-slate-600">
                    {result.algorithm}
                  </p>
                </div>
                <div className="ml-auto">
                  {completed ? (
                    <span className="badge badge-green">✓ Completed</span>
                  ) : result.route_id ? (
                    <button
                      onClick={handleComplete}
                      className="btn-ghost text-xs py-1.5"
                    >
                      <TruckIcon className="w-3.5 h-3.5" />
                      Mark Complete
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Driver + Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dark-800 border border-dark-600">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-slate-600 uppercase">
                      Driver
                    </p>
                    <p className="text-xs font-semibold">{result.driver}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dark-800 border border-dark-600">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <TruckIcon className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-slate-600 uppercase">
                      Vehicle
                    </p>
                    <p className="text-xs font-semibold font-mono">
                      {result.vehicle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost breakdown */}
              <div>
                <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-2">
                  Cost Breakdown
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard
                    label="Distance"
                    value={`${result.costs?.distance_km} km`}
                    color="#60a5fa"
                    icon="📍"
                  />
                  <StatCard
                    label="Duration"
                    value={result.costs?.duration_text}
                    color="#fbbf24"
                    icon="⏱"
                  />
                  <StatCard
                    label="Fuel Cost"
                    value={`₹${result.costs?.fuel_cost?.toLocaleString()}`}
                    color="#f97316"
                    icon="⛽"
                  />
                  <StatCard
                    label="Total Cost"
                    value={`₹${result.costs?.total_cost?.toLocaleString()}`}
                    color="#4ade80"
                    icon="💰"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <StatCard
                    label="Fuel Used"
                    value={`${result.costs?.fuel_liters}L`}
                    color="#f97316"
                    icon="🛢️"
                  />
                  <StatCard
                    label="Toll Est."
                    value={`₹${result.costs?.toll_cost?.toLocaleString()}`}
                    color="#a78bfa"
                    icon="🛣️"
                  />
                  <StatCard
                    label="CO₂ Emitted"
                    value={`${result.costs?.co2_kg} kg`}
                    color="#a3e635"
                    icon="🌿"
                  />
                </div>
              </div>

              {/* Optimized stop order */}
              {result.ordered_stops?.length > 0 && (
                <div>
                  <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-2">
                    Optimized Stop Order · {result.num_stops} stops
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {result.ordered_stops.map((stop, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                          style={{
                            background: `${STOP_COLORS[i % STOP_COLORS.length]}12`,
                            borderColor: `${STOP_COLORS[i % STOP_COLORS.length]}25`,
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                            style={{
                              background: STOP_COLORS[i % STOP_COLORS.length],
                            }}
                          >
                            {stop.index}
                          </span>
                          <span className="text-xs font-medium">
                            {stop.name.split(",")[0]}
                          </span>
                        </div>
                        {i < result.ordered_stops.length - 1 && (
                          <ArrowRightIcon className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="card p-6 flex flex-col items-center justify-center text-center min-h-[300px]"
            >
              <MapIcon className="w-12 h-12 text-dark-400 mb-4" />
              <p className="text-slate-500 text-sm">
                Add stops and click Optimize
              </p>
              <p className="font-mono text-[10px] text-slate-600 mt-2">
                AI finds optimal order · real road distances · full cost
                breakdown
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 w-full max-w-xs">
                {PRIORITY_OPTIONS.map((p) => (
                  <div
                    key={p.value}
                    className="px-2 py-2 rounded-lg bg-dark-800 border border-dark-600 text-center"
                  >
                    <p className="text-xs font-semibold">{p.label}</p>
                    <p className="text-[9px] text-slate-600 font-mono">
                      {p.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map — only shows after optimization */}
      {result?.route_points?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Syne,sans-serif" }}
              >
                Optimized Route Map
                <span
                  className="ml-2 font-mono text-[10px] font-normal"
                  style={{ color: selectedPriority?.color }}
                >
                  {selectedPriority?.label}
                </span>
              </h3>
              <div className="flex gap-4">
                <span className="font-mono text-[10px] text-slate-500">
                  📍{" "}
                  <span className="text-slate-300">
                    {result.costs?.distance_km} km
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  ⏱{" "}
                  <span className="text-slate-300">
                    {result.costs?.duration_text}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  💰{" "}
                  <span className="text-slate-300">
                    ₹{result.costs?.total_cost?.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
            <MapView
              routePoints={result.route_points}
              stops={result.ordered_stops}
              height="420px"
              zoom={6}
              center={result.route_points[0]}
              routeColor={selectedPriority?.color || "#e8001d"}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
