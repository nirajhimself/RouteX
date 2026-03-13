import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { COMPANY_ID } from "../config";
import {
  BellIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

// ─── Carrier colors ───────────────────────────────────────────────────────────
const CARRIER_COLORS = {
  Delhivery: "#60a5fa",
  DTDC: "#f97316",
  DHL: "#fbbf24",
};

const ALL_STATUSES = [
  "Booked",
  "Pickup Scheduled",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

// ─── Channel toggle ───────────────────────────────────────────────────────────
function ChannelToggle({ label, icon: Icon, color, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
      style={{
        borderColor: active ? `${color}40` : "#1f2a3c",
        background: active ? `${color}12` : "transparent",
        color: active ? color : "#475569",
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span
        className={`w-2 h-2 rounded-full ml-1 ${active ? "bg-current" : "bg-slate-700"}`}
      />
    </button>
  );
}

// ─── Send notification modal ──────────────────────────────────────────────────
function SendModal({ booking, onClose, channels }) {
  const [status, setStatus] = useState(booking.status);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const cc = CARRIER_COLORS[booking.carrier] || "#e8001d";

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await api.patch(`/booking/${booking.id}/status`, {
        status,
        channels: Object.keys(channels).filter((k) => channels[k]),
      });
      setResult({ success: true, data: res.data });
    } catch (err) {
      setResult({
        success: false,
        error: err?.response?.data?.detail || "Failed",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-6 w-full max-w-md"
      >
        <h3
          className="font-bold text-base mb-1"
          style={{ fontFamily: "Syne,sans-serif" }}
        >
          Update Status & Notify
        </h3>
        <p className="text-[10px] text-slate-500 font-mono mb-5">
          {booking.tracking_number} · {booking.receiver_name}
        </p>

        {!result ? (
          <>
            <div className="mb-4">
              <label className="label mb-2">New Status</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all"
                    style={{
                      borderColor: status === s ? `${cc}40` : "#1f2a3c",
                      background: status === s ? `${cc}12` : "transparent",
                      color: status === s ? cc : "#475569",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="label mb-2">Notify via</label>
              <div className="bg-dark-800 rounded-xl p-3 border border-dark-600 space-y-1 text-xs text-slate-400 font-mono">
                <p>📱 SMS → {booking.receiver_phone || "No phone saved"}</p>
                <p>
                  💬 WhatsApp → {booking.receiver_phone || "No phone saved"}
                </p>
                <p>📧 Email → {booking.receiver_email || "No email saved"}</p>
                <p className="text-[9px] text-slate-600 mt-2">
                  Active channels from settings panel apply automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn-ghost flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="btn-primary flex-1 justify-center disabled:opacity-60"
              >
                {sending ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" /> Send
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            {result.success ? (
              <>
                <CheckCircleIcon className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="font-semibold text-emerald-400">
                  Status Updated!
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {booking.tracking_number} →{" "}
                  <span className="font-bold">{status}</span>
                </p>
                <div className="mt-3 bg-dark-800 rounded-xl p-3 border border-dark-600 text-left space-y-1">
                  {Object.entries(result.data?.notifications || {}).map(
                    ([ch, ok]) => (
                      <div key={ch} className="flex items-center gap-2 text-xs">
                        {ok ? (
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircleIcon className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span className="capitalize font-mono">{ch}</span>
                        <span
                          className={ok ? "text-emerald-400" : "text-red-400"}
                        >
                          {ok ? "Sent" : "Failed"}
                        </span>
                      </div>
                    ),
                  )}
                  {Object.keys(result.data?.notifications || {}).length ===
                    0 && (
                    <p className="text-xs text-slate-500">
                      No channels were active (configure Twilio/SMTP keys).
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="font-semibold text-red-400">Failed</p>
                <p className="text-xs text-slate-500 mt-1">{result.error}</p>
              </>
            )}
            <button
              onClick={onClose}
              className="btn-ghost mt-4 w-full justify-center"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Notifications() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [channels, setChannels] = useState({
    sms: true,
    whatsapp: true,
    email: true,
  });
  const [notifyOn, setNotifyOn] = useState({
    Booked: true,
    "Pickup Scheduled": true,
    "In Transit": true,
    "Out for Delivery": true,
    Delivered: true,
    Cancelled: true,
  });
  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookings/${COMPANY_ID}`);
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendResult = (trackingNumber, status, results) => {
    setLogs((prev) =>
      [
        {
          id: Date.now(),
          tracking_number: trackingNumber,
          status,
          results,
          time: new Date().toLocaleTimeString("en-IN"),
        },
        ...prev,
      ].slice(0, 20),
    );
  };

  const filtered = bookings.filter(
    (b) =>
      !search ||
      b.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.receiver_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.receiver_city?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Notifications</h1>
          <p className="section-sub">
            // Auto SMS · WhatsApp · Email on status change
          </p>
        </div>
        <button onClick={load} className="btn-ghost">
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT — Settings */}
        <div className="space-y-4">
          {/* Channel toggles */}
          <div className="card p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider mb-4">
              Active Channels
            </p>
            <div className="flex flex-col gap-2">
              <ChannelToggle
                label="SMS"
                icon={DevicePhoneMobileIcon}
                color="#4ade80"
                active={channels.sms}
                onToggle={() => setChannels((c) => ({ ...c, sms: !c.sms }))}
              />
              <ChannelToggle
                label="WhatsApp"
                icon={ChatBubbleLeftIcon}
                color="#22c55e"
                active={channels.whatsapp}
                onToggle={() =>
                  setChannels((c) => ({ ...c, whatsapp: !c.whatsapp }))
                }
              />
              <ChannelToggle
                label="Email"
                icon={EnvelopeIcon}
                color="#60a5fa"
                active={channels.email}
                onToggle={() => setChannels((c) => ({ ...c, email: !c.email }))}
              />
            </div>
            <div className="mt-4 p-3 rounded-xl bg-dark-800 border border-dark-600">
              <p className="text-[9px] text-slate-600 font-mono">
                ⚙️ Add Twilio SID + Auth Token + SMTP credentials in
                <span className="text-slate-400">
                  {" "}
                  notifications_backend.py
                </span>{" "}
                to activate.
              </p>
            </div>
          </div>

          {/* Notify on status */}
          <div className="card p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider mb-4">
              Notify On Status
            </p>
            <div className="space-y-2">
              {ALL_STATUSES.map((s) => (
                <div
                  key={s}
                  onClick={() => setNotifyOn((n) => ({ ...n, [s]: !n[s] }))}
                  className="flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-all"
                  style={{
                    borderColor: notifyOn[s] ? "#e8001d30" : "#1f2a3c",
                    background: notifyOn[s] ? "#e8001d06" : "transparent",
                  }}
                >
                  <span className="text-xs font-semibold">{s}</span>
                  <div
                    className={`w-8 h-4 rounded-full relative transition-all ${notifyOn[s] ? "bg-brand-red" : "bg-dark-600"}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${notifyOn[s] ? "right-0.5" : "left-0.5"}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message preview */}
          <div className="card p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider mb-3">
              SMS Preview
            </p>
            <div className="bg-dark-800 rounded-xl p-3 border border-dark-600">
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                Hi [Customer]! Your package is IN TRANSIT with Delhivery.
                Tracking: DLV1234567890. Track: routex.app/track/DLV1234567890
              </p>
            </div>
            <div className="mt-3 bg-dark-800 rounded-xl p-3 border border-dark-600">
              <p className="font-mono text-[9px] text-slate-600 uppercase mb-2">
                WhatsApp Preview
              </p>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                📦 *RouteX Update*{"\n"}
                Status: *Out for Delivery*{"\n"}
                Tracking: `DLV1234567890`{"\n"}
                Track your package: routex.app/track/...
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Booking list + send panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Activity log */}
          {logs.length > 0 && (
            <div className="card p-4">
              <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider mb-3">
                Recent Activity
              </p>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 text-xs px-3 py-2 rounded-lg bg-dark-800 border border-dark-600"
                  >
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="font-mono text-slate-300">
                      {log.tracking_number}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="font-semibold">{log.status}</span>
                    <span className="ml-auto text-[9px] text-slate-600 font-mono">
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookings to notify */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-dark-700 flex items-center gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="input pl-8 py-2 text-xs"
                  placeholder="Search bookings to notify…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                {filtered.length} bookings
              </span>
            </div>

            {loading ? (
              <div className="p-10 flex items-center justify-center">
                <span className="text-slate-500 text-sm font-mono animate-pulse">
                  Loading…
                </span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <BellIcon className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No bookings found</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-700/50">
                {filtered.map((b) => {
                  const cc = CARRIER_COLORS[b.carrier] || "#e8001d";
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-dark-800/50 transition-all"
                    >
                      {/* Carrier dot */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: cc }}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-xs font-mono font-bold truncate"
                            style={{ color: cc }}
                          >
                            {b.tracking_number}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                              b.booking_type === "B2B"
                                ? "bg-purple-500/15 text-purple-400"
                                : "bg-pink-500/15 text-pink-400"
                            }`}
                          >
                            {b.booking_type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {b.receiver_name} · {b.receiver_city}
                          {b.receiver_phone
                            ? ` · 📱${b.receiver_phone}`
                            : " · ⚠ No phone"}
                        </p>
                      </div>

                      {/* Current status */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-slate-500 font-mono">
                          {b.status}
                        </p>
                        <p className="text-[9px] text-slate-600">{b.carrier}</p>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => setSelected(b)}
                        className="btn-primary text-[10px] px-3 py-1.5 flex-shrink-0 gap-1"
                      >
                        <PaperAirplaneIcon className="w-3 h-3" />
                        Notify
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Setup guide */}
          <div className="card p-5">
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider mb-4">
              Setup Guide
            </p>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "Install Twilio",
                  cmd: "pip install twilio",
                  desc: "For SMS and WhatsApp notifications",
                  color: "#e8001d",
                },
                {
                  step: "2",
                  title: "Get Twilio Credentials",
                  cmd: "twilio.com/console → Account SID + Auth Token",
                  desc: "Free trial gives ₹1,100 credit to start",
                  color: "#f97316",
                },
                {
                  step: "3",
                  title: "WhatsApp Sandbox",
                  cmd: "twilio.com/console/messaging/whatsapp/sandbox",
                  desc: "Customer sends 'join [word]' once to opt in",
                  color: "#22c55e",
                },
                {
                  step: "4",
                  title: "Gmail SMTP",
                  cmd: "Google Account → App Passwords → Generate",
                  desc: "Use App Password (not main Gmail password)",
                  color: "#60a5fa",
                },
                {
                  step: "5",
                  title: "Add to notifications_backend.py",
                  cmd: "Set TWILIO_* and SMTP_* variables at top",
                  desc: "Restart backend — notifications go live",
                  color: "#a78bfa",
                },
              ].map(({ step, title, cmd, desc, color }) => (
                <div key={step} className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: `${color}20`,
                      color,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    {step}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{title}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 bg-dark-800 px-2 py-1 rounded border border-dark-600 inline-block">
                      {cmd}
                    </p>
                    <p className="text-[9px] text-slate-600 mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Send modal */}
      <AnimatePresence>
        {selected && (
          <SendModal
            booking={selected}
            channels={channels}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
