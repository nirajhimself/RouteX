import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import api from "../api/api";
import { COMPANY_ID } from "../config";
import {
  SparklesIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BoltIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const CARRIERS = [
  {
    id: "delhivery",
    name: "Delhivery",
    baseRate: 45,
    minRate: 32,
    color: "#60a5fa",
  },
  { id: "dtdc", name: "DTDC", baseRate: 38, minRate: 28, color: "#f97316" },
  { id: "dhl", name: "DHL", baseRate: 72, minRate: 55, color: "#fbbf24" },
  {
    id: "bluedart",
    name: "Blue Dart",
    baseRate: 65,
    minRate: 50,
    color: "#a78bfa",
  },
  {
    id: "ecom",
    name: "Ecom Express",
    baseRate: 35,
    minRate: 26,
    color: "#34d399",
  },
];

const STATUS_STYLE = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  negotiating: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  agreed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const Bubble = ({ msg, index }) => {
  const isSystem = msg.role === "system";
  const isCompany = msg.role === "company";

  if (isSystem)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.03 }}
        className="flex justify-center my-2"
      >
        <span className="text-[10px] font-mono text-slate-600 bg-dark-700 border border-dark-500 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={`flex gap-2.5 ${isCompany ? "flex-row-reverse" : ""} mb-3`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
        ${
          msg.role === "ai"
            ? "bg-brand-red/15 border border-brand-red/30"
            : msg.role === "carrier"
              ? "bg-blue-500/15 border border-blue-500/30"
              : "bg-emerald-500/15 border border-emerald-500/30"
        }`}
      >
        {msg.role === "ai" ? (
          <SparklesIcon className="w-3.5 h-3.5 text-brand-red" />
        ) : msg.role === "carrier" ? (
          <TruckIcon className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <BuildingOfficeIcon className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </div>
      <div
        className={`max-w-[75%] flex flex-col ${isCompany ? "items-end" : "items-start"}`}
      >
        <span className="text-[10px] font-mono text-slate-600 mb-1 px-1">
          {msg.sender}
        </span>
        <div
          className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed
          ${
            msg.role === "ai"
              ? "bg-brand-red/8 border border-brand-red/15 text-slate-200"
              : msg.role === "carrier"
                ? "bg-dark-700 border border-dark-500 text-slate-300"
                : "bg-dark-600 border border-dark-400 text-slate-200"
          }`}
        >
          {msg.content}
        </div>
        {msg.price && (
          <div
            className={`mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
            ${
              msg.accepted
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}
          >
            <CurrencyRupeeIcon className="w-3 h-3" />
            <span className="font-mono font-bold text-xs">₹{msg.price}/kg</span>
            {msg.accepted && <CheckCircleIcon className="w-3 h-3 ml-1" />}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function Negotiation() {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState("");
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState("");
  const [priority, setPriority] = useState("balanced");
  const chatRef = useRef(null);

  useEffect(() => {
    api
      .get(`/bookings/${COMPANY_ID}`)
      .then((r) => setBookings(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [active]);

  const startNegotiation = async () => {
    if (loading) return;
    setLoading(true);
    const booking = bookings.find((b) => b.id === parseInt(selected));
    const weight = booking?.weight_kg || 15;
    const targetRate =
      parseFloat(budget) || Math.round(carrier.baseRate * 0.83);
    try {
      const res = await api.post("/negotiate", {
        carrier_id: carrier.id,
        weight_kg: weight,
        sender_city: booking?.sender_city || "Mumbai",
        receiver_city: booking?.receiver_city || "Delhi",
        declared_value: booking?.declared_value || 0,
        tracking_number: booking?.tracking_number || "DEMO-001",
        booking_type: booking?.booking_type || "B2C",
        is_recurring: false,
        target_rate: targetRate,
        priority,
      });
      const result = res.data;
      const session = {
        id: Date.now(),
        carrier: carrier.name,
        carrierId: carrier.id,
        tracking: booking?.tracking_number || "DEMO-001",
        weight,
        startRate: carrier.baseRate,
        targetRate,
        finalRate: result.final_rate,
        savings: result.savings,
        status: result.status,
        rounds: result.rounds,
        leverage: result.leverage,
        estDays: result.est_days,
        messages: result.messages,
        startedAt: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setSessions((prev) => [session, ...prev]);
      setActive(session);
    } catch (err) {
      alert(
        "Negotiation error: " + (err?.response?.data?.detail || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = sessions
    .filter((s) => s.status === "agreed")
    .reduce((sum, s) => sum + (s.savings || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-brand-red" /> AI Negotiation
          </h1>
          <p className="section-sub">
            // AI agent negotiates transport cost automatically with carriers
          </p>
        </div>
        {totalSavings > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">
              ₹{totalSavings.toLocaleString("en-IN")} saved today
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Left */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card p-5 space-y-4">
            <h3
              className="text-sm font-semibold flex items-center gap-2"
              style={{ fontFamily: "Syne,sans-serif" }}
            >
              <ScaleIcon className="w-4 h-4 text-brand-red" /> Setup Negotiation
            </h3>
            <div>
              <label className="label">Booking (optional)</label>
              <select
                className="select text-xs"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">— Demo: 15kg Mumbai→Delhi —</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.tracking_number} · {b.receiver_name} · {b.weight_kg}kg
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Carrier</label>
              <div className="space-y-2">
                {CARRIERS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCarrier(c)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs transition-all
                      ${carrier.id === c.id ? "border-brand-red/40 bg-brand-red/8 text-slate-100" : "border-dark-500 bg-dark-700 text-slate-400 hover:border-dark-400"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: c.color }}
                      />
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500">₹{c.baseRate}/kg</span>
                      <span className="text-[10px] text-emerald-400">
                        floor ₹{c.minRate}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Your Target Rate (₹/kg)</label>
              <input
                type="number"
                className="input text-xs"
                placeholder={`e.g. ${Math.round(carrier.baseRate * 0.82)}`}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cost", label: "Cost", sub: "Min price" },
                  { id: "balanced", label: "Balance", sub: "Cost+speed" },
                  { id: "speed", label: "Speed", sub: "Fast del." },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={`px-2 py-2 rounded-xl border text-center transition-all
                      ${priority === p.id ? "border-brand-red/40 bg-brand-red/8" : "border-dark-500 bg-dark-700 hover:border-dark-400"}`}
                  >
                    <p
                      className={`text-xs font-semibold ${priority === p.id ? "text-brand-red" : "text-slate-300"}`}
                    >
                      {p.label}
                    </p>
                    <p className="text-[10px] text-slate-600 font-mono">
                      {p.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startNegotiation}
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Negotiating...
                </>
              ) : (
                <>
                  <BoltIcon className="w-4 h-4" />
                  Start AI Negotiation
                </>
              )}
            </button>
          </div>

          {sessions.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-widest mb-3">
                History
              </h3>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(s)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left
                      ${active?.id === s.id ? "border-brand-red/30 bg-brand-red/5" : "border-dark-500 bg-dark-700 hover:border-dark-400"}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {s.carrier}
                      </p>
                      <p className="text-[10px] font-mono text-slate-600">
                        {s.tracking} · {s.weight}kg · {s.rounds} rounds
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${STATUS_STYLE[s.status]}`}
                      >
                        {s.status}
                      </span>
                      {s.finalRate && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          ₹{s.finalRate}/kg
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="xl:col-span-3">
          <div className="card flex flex-col" style={{ minHeight: 620 }}>
            <div className="px-5 py-4 border-b border-dark-600 flex items-center justify-between">
              {active ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-red/15 border border-brand-red/30 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-brand-red" />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ fontFamily: "Syne,sans-serif" }}
                    >
                      RouteX Agent · {active.carrier}
                    </p>
                    <p className="text-[10px] font-mono text-slate-600">
                      {active.weight}kg · Target ₹{active.targetRate}/kg ·
                      leverage {Math.round(active.leverage * 100)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span className="text-sm">No active session</span>
                </div>
              )}
              {active?.status === "agreed" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="text-right">
                    <p className="text-xs font-mono text-emerald-400 font-bold">
                      ₹{active.finalRate}/kg
                    </p>
                    {active.savings > 0 && (
                      <p className="text-[10px] text-emerald-600">
                        saved ₹{active.savings}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {active?.status === "failed" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <XCircleIcon className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-mono text-red-400">
                    No deal reached
                  </span>
                </div>
              )}
            </div>

            <div ref={chatRef} className="flex-1 overflow-y-auto p-5">
              {!active ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center">
                    <SparklesIcon className="w-8 h-8 text-brand-red/60" />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold text-slate-400 mb-1"
                      style={{ fontFamily: "Syne,sans-serif" }}
                    >
                      AI Agent Ready
                    </p>
                    <p className="text-xs text-slate-600 font-mono max-w-xs">
                      Configure shipment + carrier, click Start. The agent
                      handles the entire negotiation automatically.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                    {[
                      {
                        label: "Leverage calc",
                        color: "text-emerald-400",
                        icon: ChartBarIcon,
                      },
                      {
                        label: "Multi-round logic",
                        color: "text-brand-red",
                        icon: SparklesIcon,
                      },
                      {
                        label: "Carrier profiles",
                        color: "text-blue-400",
                        icon: TruckIcon,
                      },
                    ].map(({ label, color, icon: Ic }, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-dark-700 border border-dark-500"
                      >
                        <Ic className={`w-5 h-5 ${color}`} />
                        <span className="text-[10px] text-slate-500 text-center font-mono">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                active.messages.map((msg, i) => (
                  <Bubble key={i} msg={msg} index={i} />
                ))
              )}
            </div>

            {active && (
              <div className="px-5 py-3 border-t border-dark-600">
                <div className="flex items-center justify-between text-[10px] font-mono flex-wrap gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-slate-600">
                      Market:{" "}
                      <span className="text-slate-400">
                        ₹{active.startRate}/kg
                      </span>
                    </span>
                    <span className="text-slate-600">
                      Target:{" "}
                      <span className="text-amber-400">
                        ₹{active.targetRate}/kg
                      </span>
                    </span>
                    {active.finalRate && (
                      <span className="text-slate-600">
                        Final:{" "}
                        <span className="text-emerald-400 font-bold">
                          ₹{active.finalRate}/kg
                        </span>
                      </span>
                    )}
                    {active.estDays && (
                      <span className="text-slate-600">
                        ETA:{" "}
                        <span className="text-blue-400">{active.estDays}d</span>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-600">
                    {active.messages.length} msgs · {active.rounds} rounds
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
