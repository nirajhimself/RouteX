import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import {
  MagnifyingGlassIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  QrCodeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// ─── QR Code display ──────────────────────────────────────────────────────────
function QRCode({ value, size = 120 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0d1117&color=ffffff&margin=10`;
  return (
    <img
      src={url}
      alt="QR"
      width={size}
      height={size}
      className="rounded-xl border border-dark-500"
    />
  );
}

// ─── Timeline step ────────────────────────────────────────────────────────────
function TimelineStep({ label, desc, date, done, active }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
            done
              ? "bg-emerald-500 border-emerald-500"
              : active
                ? "bg-brand-red border-brand-red animate-pulse"
                : "bg-dark-800 border-dark-600"
          }`}
        >
          {done ? (
            <CheckCircleIcon className="w-4 h-4 text-white" />
          ) : active ? (
            <TruckIcon className="w-4 h-4 text-white" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-dark-500" />
          )}
        </div>
        <div
          className={`w-0.5 h-10 mt-1 ${done ? "bg-emerald-500" : "bg-dark-600"}`}
        />
      </div>
      <div className="pb-6">
        <p
          className={`text-sm font-semibold ${active ? "text-white" : done ? "text-emerald-400" : "text-slate-600"}`}
        >
          {label}
        </p>
        <p className="text-[10px] text-slate-600 font-mono mt-0.5">{desc}</p>
        {date && <p className="text-[10px] text-slate-500 mt-1">{date}</p>}
      </div>
    </div>
  );
}

// ─── Carrier colors ───────────────────────────────────────────────────────────
const CARRIER_COLORS = {
  Delhivery: "#60a5fa",
  DTDC: "#f97316",
  DHL: "#fbbf24",
};

const STATUS_STEPS = {
  Booked: 0,
  "Pickup Scheduled": 1,
  "In Transit": 2,
  "Out for Delivery": 3,
  Delivered: 4,
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TrackingPortal() {
  const [trackingInput, setTrackingInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("track_history") || "[]");
    } catch {
      return [];
    }
  });

  const handleTrack = async (id = trackingInput) => {
    const tn = id.trim().toUpperCase();
    if (!tn) {
      setError("Enter a tracking number");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.get(`/booking/track/${tn}`);
      setResult(res.data);
      // Save to history
      const newHistory = [tn, ...history.filter((h) => h !== tn)].slice(0, 5);
      setHistory(newHistory);
      try {
        localStorage.setItem("track_history", JSON.stringify(newHistory));
      } catch {}
    } catch (err) {
      setError(err?.response?.data?.detail || "Tracking number not found.");
    } finally {
      setLoading(false);
    }
  };

  const statusIndex = result ? (STATUS_STEPS[result.status] ?? 0) : 0;
  const carrierColor = result
    ? CARRIER_COLORS[result.carrier] || "#e8001d"
    : "#e8001d";

  const timeline = [
    { label: "Booked", desc: "Order placed & carrier assigned" },
    { label: "Pickup Scheduled", desc: "Carrier will collect the package" },
    { label: "In Transit", desc: "Package on the way to destination" },
    { label: "Out for Delivery", desc: "Driver is near your location" },
    { label: "Delivered", desc: "Package delivered successfully" },
  ];

  return (
    <div className="min-h-screen bg-dark-950 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Route<span style={{ color: "#e8001d" }}>X</span>
          </h1>
          <p className="text-slate-500 text-sm font-mono">
            // Track your shipment
          </p>
        </div>

        {/* Search box */}
        <div className="card p-5">
          <p
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Enter Tracking Number
          </p>
          <div className="flex gap-2">
            <input
              className="input flex-1 font-mono tracking-wider uppercase"
              placeholder="e.g. DLV1234567890"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
            <button
              onClick={() => handleTrack()}
              disabled={loading}
              className="btn-primary px-4 py-2 disabled:opacity-60 flex-shrink-0"
            >
              {loading ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 mt-2 font-mono">{error}</p>
          )}

          {/* Recent searches */}
          {history.length > 0 && !result && (
            <div className="mt-4">
              <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider mb-2">
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setTrackingInput(h);
                      handleTrack(h);
                    }}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-600 text-slate-400 hover:text-slate-200 hover:border-dark-500 transition-all"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Status banner */}
              <div
                className="card p-5"
                style={{
                  borderColor: `${carrierColor}30`,
                  background: `${carrierColor}05`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        TRACKING
                      </span>
                      <span
                        className="font-mono text-xs font-bold tracking-wider"
                        style={{ color: carrierColor }}
                      >
                        {result.tracking_number}
                      </span>
                    </div>
                    <p
                      className="text-xl font-bold"
                      style={{
                        fontFamily: "Syne,sans-serif",
                        color: carrierColor,
                      }}
                    >
                      {result.status}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {result.carrier} {result.service_type} · Est.{" "}
                      {result.estimated_days} days
                    </p>
                  </div>
                  <QRCode value={result.tracking_number} size={80} />
                </div>
              </div>

              {/* Package info */}
              <div className="card p-4">
                <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-3">
                  Shipment Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Receiver", result.receiver_name],
                    ["City", result.receiver_city],
                    ["Product", result.product_name || "—"],
                    ["Carrier", `${result.carrier} ${result.service_type}`],
                    [
                      "Booked On",
                      new Date(result.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }),
                    ],
                    ["Est. Delivery", `${result.estimated_days} business days`],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      className="bg-dark-800 rounded-lg px-3 py-2.5 border border-dark-600"
                    >
                      <p className="text-[9px] text-slate-600 font-mono uppercase">
                        {l}
                      </p>
                      <p className="text-xs font-semibold mt-0.5 truncate">
                        {v || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="card p-5">
                <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-4">
                  Shipment Timeline
                </p>
                <div>
                  {timeline.map((step, i) => (
                    <TimelineStep
                      key={i}
                      label={step.label}
                      desc={step.desc}
                      done={i < statusIndex}
                      active={i === statusIndex}
                      date={
                        i === 0
                          ? new Date(result.created_at).toLocaleString("en-IN")
                          : null
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Track another */}
              <button
                onClick={() => {
                  setResult(null);
                  setTrackingInput("");
                }}
                className="btn-ghost w-full justify-center"
              >
                Track Another Shipment
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-700 font-mono pb-4">
          RouteX Logistics Platform · Powered by DTDC · Delhivery · DHL
        </p>
      </div>
    </div>
  );
}
