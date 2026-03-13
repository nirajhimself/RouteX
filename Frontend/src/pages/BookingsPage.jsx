import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { COMPANY_ID } from "../config";
import {
  QrCodeIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

// ─── QR Code ──────────────────────────────────────────────────────────────────
function QRCode({ value, size = 140 }) {
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

// ─── Carrier colors ───────────────────────────────────────────────────────────
const CARRIER_COLORS = {
  Delhivery: "#60a5fa",
  DTDC: "#f97316",
  DHL: "#fbbf24",
};
const STATUS_COLORS = {
  Booked: { text: "#60a5fa", bg: "#60a5fa12", border: "#60a5fa25" },
  "In Transit": { text: "#fbbf24", bg: "#fbbf2412", border: "#fbbf2425" },
  Delivered: { text: "#4ade80", bg: "#4ade8012", border: "#4ade8025" },
  Cancelled: { text: "#f87171", bg: "#f8717112", border: "#f8717125" },
};

// ─── Booking detail modal ─────────────────────────────────────────────────────
function BookingModal({ booking, onClose, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const cc = CARRIER_COLORS[booking.carrier] || "#e8001d";
  const sc = STATUS_COLORS[booking.status] || STATUS_COLORS["Booked"];

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Shipping Label - ${booking.tracking_number}</title>
      <style>
        body { font-family: monospace; padding: 20px; background: #fff; color: #000; }
        .label { border: 2px solid #000; padding: 20px; max-width: 400px; margin: 0 auto; }
        h2 { font-size: 24px; margin: 0 0 10px; }
        .tracking { font-size: 20px; font-weight: bold; letter-spacing: 2px; border: 1px solid #000; padding: 8px; text-align: center; margin: 12px 0; }
        .section { margin: 10px 0; }
        .label-sm { font-size: 10px; color: #666; text-transform: uppercase; }
        .value { font-size: 13px; font-weight: bold; }
        img { display: block; margin: 10px auto; }
        .divider { border-top: 1px dashed #000; margin: 12px 0; }
      </style></head>
      <body>
        <div class="label">
          <h2>RouteX Logistics</h2>
          <div class="tracking">${booking.tracking_number}</div>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${booking.tracking_number}&bgcolor=ffffff&color=000000&margin=5" />
          <div class="divider"></div>
          <div class="section">
            <div class="label-sm">FROM</div>
            <div class="value">${booking.sender_name || "—"}</div>
            <div>${booking.sender_address || ""}, ${booking.sender_city || ""} - ${booking.sender_pincode || ""}</div>
          </div>
          <div class="divider"></div>
          <div class="section">
            <div class="label-sm">TO</div>
            <div class="value">${booking.receiver_name}</div>
            <div>${booking.receiver_address}, ${booking.receiver_city} - ${booking.receiver_pincode}</div>
            <div>📞 ${booking.receiver_phone || "—"}</div>
          </div>
          <div class="divider"></div>
          <div class="section">
            <div class="label-sm">Carrier</div>
            <div class="value">${booking.carrier} · ${booking.service_type}</div>
          </div>
          <div class="section">
            <div class="label-sm">Product</div>
            <div class="value">${booking.product_name || "—"} · ${booking.weight_kg} kg</div>
          </div>
          <div class="section">
            <div class="label-sm">Declared Value</div>
            <div class="value">₹${booking.declared_value?.toLocaleString() || "—"}</div>
          </div>
        </div>
        <script>window.onload=()=>window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/booking/${booking.id}/status`, { status: "Cancelled" });
      onCancel(booking.id);
      onClose();
    } catch {
      alert("Failed to cancel booking");
    } finally {
      setCancelling(false);
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
        className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">
              Booking Detail
            </p>
            <p
              className="font-mono text-lg font-bold tracking-wider mt-0.5"
              style={{ color: cc }}
            >
              {booking.tracking_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
              style={{
                color: sc.text,
                background: sc.bg,
                border: `1px solid ${sc.border}`,
              }}
            >
              {booking.status}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-dark-500 text-slate-500 hover:text-slate-300 transition-all"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR + carrier */}
        <div className="flex gap-4 mb-5">
          <QRCode value={booking.tracking_number} size={120} />
          <div className="space-y-2 flex-1">
            <div className="bg-dark-800 rounded-lg p-2.5 border border-dark-600">
              <p className="text-[9px] text-slate-600 font-mono uppercase">
                Carrier
              </p>
              <p className="text-sm font-bold" style={{ color: cc }}>
                {booking.carrier} · {booking.service_type}
              </p>
            </div>
            <div className="bg-dark-800 rounded-lg p-2.5 border border-dark-600">
              <p className="text-[9px] text-slate-600 font-mono uppercase">
                Type
              </p>
              <p className="text-sm font-bold">{booking.booking_type}</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-2.5 border border-dark-600">
              <p className="text-[9px] text-slate-600 font-mono uppercase">
                Rate
              </p>
              <p className="text-sm font-bold text-emerald-400">
                ₹{booking.carrier_rate?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-dark-800 rounded-xl p-3 border border-dark-600">
            <p className="text-[9px] text-slate-600 font-mono uppercase mb-1">
              📦 From
            </p>
            <p className="text-xs font-semibold">
              {booking.sender_name || "—"}
            </p>
            <p className="text-[10px] text-slate-500">
              {booking.sender_city} {booking.sender_pincode}
            </p>
          </div>
          <div className="bg-dark-800 rounded-xl p-3 border border-dark-600">
            <p className="text-[9px] text-slate-600 font-mono uppercase mb-1">
              📍 To
            </p>
            <p className="text-xs font-semibold">{booking.receiver_name}</p>
            <p className="text-[10px] text-slate-500">
              {booking.receiver_city} {booking.receiver_pincode}
            </p>
            {booking.receiver_phone && (
              <p className="text-[10px] text-slate-500">
                {booking.receiver_phone}
              </p>
            )}
          </div>
        </div>

        {/* Package */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            ["Product", booking.product_name || "—"],
            ["Weight", `${booking.weight_kg} kg`],
            [
              "Value",
              booking.declared_value
                ? `₹${booking.declared_value?.toLocaleString()}`
                : "—",
            ],
            ["Est Days", `${booking.estimated_days} days`],
            [
              "Booked",
              new Date(booking.created_at).toLocaleDateString("en-IN"),
            ],
            [
              "Dims",
              booking.length_cm
                ? `${booking.length_cm}×${booking.width_cm}×${booking.height_cm}`
                : "—",
            ],
          ].map(([l, v]) => (
            <div
              key={l}
              className="bg-dark-800 rounded-lg p-2 border border-dark-600 text-center"
            >
              <p className="text-[9px] text-slate-600 font-mono uppercase">
                {l}
              </p>
              <p className="text-xs font-semibold mt-0.5 truncate">{v}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="btn-ghost flex-1 justify-center text-sm"
          >
            <PrinterIcon className="w-4 h-4" /> Print Label
          </button>
          {booking.status !== "Cancelled" && booking.status !== "Delivered" && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <XMarkIcon className="w-4 h-4" />
              )}
              Cancel Booking
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

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

  const handleCancel = (id) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b)),
    );
  };

  const FILTERS = ["All", "Booked", "In Transit", "Delivered", "Cancelled"];

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === "All" || b.status === filter;
    const matchesSearch =
      !search ||
      [
        b.tracking_number,
        b.receiver_name,
        b.receiver_city,
        b.carrier,
        b.product_name,
        b.booking_type,
      ].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    booked: bookings.filter((b) => b.status === "Booked").length,
    transit: bookings.filter((b) => b.status === "In Transit").length,
    delivered: bookings.filter((b) => b.status === "Delivered").length,
    b2b: bookings.filter((b) => b.booking_type === "B2B").length,
    b2c: bookings.filter((b) => b.booking_type === "B2C").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Bookings</h1>
          <p className="section-sub">
            // {bookings.length} total · B2B + B2C · DTDC · Delhivery · DHL
          </p>
        </div>
        <button onClick={load} className="btn-ghost">
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          ["Total", stats.total, "#60a5fa"],
          ["Booked", stats.booked, "#60a5fa"],
          ["Transit", stats.transit, "#fbbf24"],
          ["Delivered", stats.delivered, "#4ade80"],
          ["B2B", stats.b2b, "#818cf8"],
          ["B2C", stats.b2c, "#e879f9"],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-3 text-center">
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "Syne,sans-serif", color: c }}
            >
              {v}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">{l}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search tracking number, receiver, carrier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filter === f
                  ? "bg-brand-red/20 border-brand-red/40 text-brand-red"
                  : "border-dark-500 text-slate-500 hover:text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center">
          <span className="text-slate-500 text-sm font-mono animate-pulse">
            Loading bookings…
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <TruckIcon className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No bookings found.</p>
          <p className="text-[10px] text-slate-600 font-mono mt-1">
            Try changing the filter or create a new booking.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dark-700">
                  {[
                    "Tracking #",
                    "Type",
                    "Receiver",
                    "City",
                    "Carrier",
                    "Weight",
                    "Rate",
                    "Status",
                    "Date",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[9px] text-slate-500 font-mono uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const cc = CARRIER_COLORS[b.carrier] || "#e8001d";
                  const sc = STATUS_COLORS[b.status] || STATUS_COLORS["Booked"];
                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-dark-700/50 hover:bg-dark-800/50 transition-all ${i % 2 === 0 ? "" : "bg-dark-900/30"}`}
                    >
                      <td
                        className="px-4 py-3 font-mono font-bold text-[11px]"
                        style={{ color: cc }}
                      >
                        {b.tracking_number}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            b.booking_type === "B2B"
                              ? "bg-purple-500/15 text-purple-400"
                              : "bg-pink-500/15 text-pink-400"
                          }`}
                        >
                          {b.booking_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold max-w-[120px] truncate">
                        {b.receiver_name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {b.receiver_city}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold" style={{ color: cc }}>
                          {b.carrier}
                        </span>
                        <span className="text-slate-600 ml-1">
                          {b.service_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{b.weight_kg} kg</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        ₹{b.carrier_rate?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                          style={{
                            color: sc.text,
                            background: sc.bg,
                            border: `1px solid ${sc.border}`,
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(b.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setSelected(b)}
                            title="View Details"
                            className="p-1.5 rounded-md border border-dark-500 text-slate-500 hover:text-slate-300 hover:border-dark-400 transition-all"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelected(b)}
                            title="Show QR"
                            className="p-1.5 rounded-md border border-dark-500 text-slate-500 hover:text-blue-400 hover:border-blue-400/30 transition-all"
                          >
                            <QrCodeIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <BookingModal
            booking={selected}
            onClose={() => setSelected(null)}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
