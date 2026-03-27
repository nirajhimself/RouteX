import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import { PageLoader, ErrorState } from "../components/Loader";
import { driverService } from "../services/driverService";
import { vehicleService } from "../services/vehicleService";
import { shipmentService } from "../services/shipmentService";
import { warehouseService } from "../services/warehouseService";
import api from "../api/api";
import { COMPANY_ID } from "../config";
import {
  UsersIcon,
  TruckIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  MapIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  in_transit: "badge-blue",
  "In Transit": "badge-blue",
  delivered: "badge-green",
  Delivered: "badge-green",
  pending: "badge-yellow",
  Pending: "badge-yellow",
  delayed: "badge-red",
  Delayed: "badge-red",
  cancelled: "badge-gray",
  Cancelled: "badge-gray",
  Booked: "badge-blue",
  booked: "badge-blue",
  "Out for Delivery": "badge-yellow",
};
const STATUS_COLORS = {
  delivered: "#4ade80",
  in_transit: "#60a5fa",
  pending: "#fbbf24",
  delayed: "#f87171",
  cancelled: "#6b7280",
  booked: "#818cf8",
  out_for_delivery: "#f97316",
};
const CARRIER_COLORS = {
  Delhivery: "#60a5fa",
  DTDC: "#f97316",
  DHL: "#fbbf24",
};

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/90 border border-gray-700 rounded-lg p-2.5 text-xs font-mono shadow-xl text-white">
      <p className="text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Mini stat pill ────────────────────────────────────────────────────────────
const MiniStat = ({ label, value, color }) => (
  <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-dark-800 border border-dark-600">
    <span
      className="font-bold text-lg leading-none"
      style={{ fontFamily: "Syne,sans-serif", color }}
    >
      {value}
    </span>
    <span className="text-[10px] text-slate-500 font-mono mt-1">{label}</span>
  </div>
);

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        driversRes,
        vehiclesRes,
        shipmentsRes,
        warehousesRes,
        bookingsRes,
      ] = await Promise.all([
        driverService.getAll(COMPANY_ID),
        vehicleService.getAll(COMPANY_ID),
        shipmentService.getAll(COMPANY_ID),
        warehouseService.getAll(COMPANY_ID),
        api.get(`/bookings/${COMPANY_ID}`).catch(() => ({ data: [] })),
      ]);

      const drivers = Array.isArray(driversRes.data)
        ? driversRes.data
        : (driversRes.data?.drivers ?? []);
      const vehicles = Array.isArray(vehiclesRes.data)
        ? vehiclesRes.data
        : (vehiclesRes.data?.vehicles ?? []);
      const shipments = Array.isArray(shipmentsRes.data)
        ? shipmentsRes.data
        : (shipmentsRes.data?.shipments ?? []);
      const warehouses = Array.isArray(warehousesRes.data)
        ? warehousesRes.data
        : (warehousesRes.data?.warehouses ?? []);
      const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

      // ── Status pie (shipments) ──
      const statusCounts = shipments.reduce((acc, s) => {
        const k = (s.status || "unknown").toLowerCase().replace(/ /g, "_");
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {});
      const statusPie = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
        color: STATUS_COLORS[name] || "#6b7280",
      }));

      // ── Shipment activity by day of week ──
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const shipByDay = Array(7).fill(0);
      const bookByDay = Array(7).fill(0);
      shipments.forEach((s) => {
        const d = s.created_at || s.date;
        if (d) shipByDay[new Date(d).getDay()]++;
      });
      bookings.forEach((b) => {
        const d = b.created_at;
        if (d) bookByDay[new Date(d).getDay()]++;
      });
      const activityChart = days.map((day, i) => ({
        day,
        Shipments: shipByDay[i],
        Bookings: bookByDay[i],
      }));

      // ── Bookings by carrier ──
      const carrierCounts = bookings.reduce((acc, b) => {
        const c = b.carrier || "Other";
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {});
      const carrierChart = Object.entries(carrierCounts).map(
        ([carrier, count]) => ({
          carrier,
          count,
          color: CARRIER_COLORS[carrier] || "#818cf8",
        }),
      );

      // ── Booking status counts ──
      const bookingStatusCounts = bookings.reduce((acc, b) => {
        acc[b.status || "Booked"] = (acc[b.status || "Booked"] || 0) + 1;
        return acc;
      }, {});

      // ── Recent items ──
      const recentShipments = [...shipments]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
        )
        .slice(0, 5);
      const recentBookings = [...bookings]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
        )
        .slice(0, 5);

      // ── Delivery rate ──
      const delivered = shipments.filter(
        (s) => (s.status || "").toLowerCase() === "delivered",
      ).length;
      const deliveryRate =
        shipments.length > 0
          ? Math.round((delivered / shipments.length) * 100)
          : 0;

      setData({
        drivers,
        vehicles,
        shipments,
        warehouses,
        bookings,
        statusPie,
        activityChart,
        carrierChart,
        bookingStatusCounts,
        recentShipments,
        recentBookings,
        deliveryRate,
      });
      setLastRefresh(new Date());
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <PageLoader label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const {
    drivers,
    vehicles,
    shipments,
    warehouses,
    bookings,
    statusPie,
    activityChart,
    carrierChart,
    bookingStatusCounts,
    recentShipments,
    recentBookings,
    deliveryRate,
  } = data;

  const availableDrivers = drivers.filter(
    (d) => d.is_available !== false,
  ).length;
  const availableVehicles = vehicles.filter(
    (v) => v.is_available !== false,
  ).length;
  const pendingShipments = shipments.filter((s) =>
    (s.status || "").toLowerCase().includes("pending"),
  ).length;
  const inTransitCount = shipments.filter((s) =>
    (s.status || "").toLowerCase().includes("transit"),
  ).length;
  const deliveredCount = shipments.filter(
    (s) => (s.status || "").toLowerCase() === "delivered",
  ).length;
  const b2bCount = bookings.filter((b) => b.booking_type === "B2B").length;
  const b2cCount = bookings.filter((b) => b.booking_type === "B2C").length;

  const STATS = [
    {
      title: "Total Drivers",
      value: drivers.length,
      icon: UsersIcon,
      accent: "#4ade80",
      sub: `${availableDrivers} available`,
    },
    {
      title: "Vehicles",
      value: vehicles.length,
      icon: TruckIcon,
      accent: "#fbbf24",
      sub: `${availableVehicles} available`,
    },
    {
      title: "Shipments",
      value: shipments.length,
      icon: ArchiveBoxIcon,
      accent: "#e8001d",
      sub: `${inTransitCount} in transit`,
    },
    {
      title: "Warehouses",
      value: warehouses.length,
      icon: BuildingStorefrontIcon,
      accent: "#818cf8",
      sub: "storage units",
    },
    {
      title: "Bookings",
      value: bookings.length,
      icon: ClipboardDocumentListIcon,
      accent: "#22d3ee",
      sub: `${b2bCount} B2B · ${b2cCount} B2C`,
    },
    {
      title: "Delivery Rate",
      value: `${deliveryRate}%`,
      icon: CheckCircleIcon,
      accent: "#4ade80",
      sub: `${deliveredCount} delivered`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Control Center</h1>
          <p className="section-sub">
            // live logistics overview ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="font-mono text-[10px] text-slate-600 hidden sm:block">
              updated{" "}
              {lastRefresh.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-500 text-slate-500 hover:text-slate-300 hover:border-dark-400 transition-all text-xs font-mono"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {STATS.map((s, i) => (
          <StatsCard key={s.title} {...s} delay={i * 0.07} />
        ))}
      </div>

      {/* Live status pills */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold font-mono text-slate-500 uppercase tracking-widest">
            Live Shipment Status
          </h3>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusPie.length > 0 ? (
            statusPie.map((s, i) => (
              <MiniStat
                key={i}
                label={s.name}
                value={s.value}
                color={s.color}
              />
            ))
          ) : (
            <p className="text-xs text-slate-500">No shipments yet</p>
          )}
          <MiniStat
            label="Total Bookings"
            value={bookings.length}
            color="#22d3ee"
          />
          <MiniStat label="B2B" value={b2bCount} color="#818cf8" />
          <MiniStat label="B2C" value={b2cCount} color="#f472b6" />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="xl:col-span-2 card p-5">
          <h3
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Weekly Activity
          </h3>
          <p className="font-mono text-[10px] text-slate-600 mb-4">
            shipments + bookings by day of week
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityChart} barGap={4}>
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
                dataKey="Shipments"
                fill="#e8001d"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              <Bar
                dataKey="Bookings"
                fill="#22d3ee"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: "#475569",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <h3
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Status Breakdown
          </h3>
          <p className="font-mono text-[10px] text-slate-600 mb-3">
            live from database
          </p>
          {statusPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie
                    data={statusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {statusPie.map((e, i) => (
                      <Cell key={i} fill={e.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0c1018",
                      border: "1px solid #1f2a3c",
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {statusPie.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ background: s.color }}
                      />
                      <span className="text-xs text-slate-400">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-dark-600 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((s.value / shipments.length) * 100)}%`,
                            background: s.color,
                          }}
                        />
                      </div>
                      <span
                        className="font-mono text-xs w-4 text-right"
                        style={{ color: s.color }}
                      >
                        {s.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 mt-8 text-center">
              No shipment data yet
            </p>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Carrier distribution */}
        <div className="card p-5">
          <h3
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Bookings by Carrier
          </h3>
          <p className="font-mono text-[10px] text-slate-600 mb-4">
            total bookings per carrier
          </p>
          {carrierChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={carrierChart} layout="vertical" barSize={18}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,.04)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 10,
                    fill: "#475569",
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="carrier"
                  tick={{
                    fontSize: 10,
                    fill: "#475569",
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Bookings" radius={[0, 4, 4, 0]}>
                  {carrierChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-xs text-slate-500">No booking data yet</p>
            </div>
          )}
        </div>

        {/* Delivery rate gauge */}
        <div className="card p-5">
          <h3
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Performance Overview
          </h3>
          <p className="font-mono text-[10px] text-slate-600 mb-4">
            delivery success metrics
          </p>
          <div className="space-y-3">
            {[
              { label: "Delivery Rate", value: deliveryRate, color: "#4ade80" },
              {
                label: "In Transit",
                value: shipments.length
                  ? Math.round((inTransitCount / shipments.length) * 100)
                  : 0,
                color: "#60a5fa",
              },
              {
                label: "Pending Rate",
                value: shipments.length
                  ? Math.round((pendingShipments / shipments.length) * 100)
                  : 0,
                color: "#fbbf24",
              },
              {
                label: "Driver Util.",
                value: drivers.length
                  ? Math.round(
                      ((drivers.length - availableDrivers) /
                        Math.max(drivers.length, 1)) *
                        100,
                    )
                  : 0,
                color: "#f472b6",
              },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color }}
                  >
                    {value}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <Link
              to="/bookings-list"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600 hover:border-dark-400 transition-all"
            >
              <ClipboardDocumentListIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-300">All Bookings</span>
            </Link>
            <Link
              to="/notifications"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600 hover:border-dark-400 transition-all"
            >
              <BellAlertIcon className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-300">Notifications</span>
            </Link>
            <Link
              to="/routes"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600 hover:border-dark-400 transition-all"
            >
              <MapIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-300">
                Route Optimizer
              </span>
            </Link>
            <Link
              to="/track"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600 hover:border-dark-400 transition-all"
            >
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-300">Track Parcel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent tables side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Shipments */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-600 flex justify-between items-center">
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: "Syne,sans-serif" }}
            >
              Recent Shipments
            </h3>
            <Link
              to="/shipments"
              className="font-mono text-[10px] text-slate-500 hover:text-brand-red transition-colors"
            >
              View all →
            </Link>
          </div>
          {recentShipments.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">
              No shipments yet
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-dark-800">
                  {["ID", "Route", "Weight", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 font-mono border-b border-dark-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-dark-700 hover:bg-dark-700 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-brand-red font-bold">
                      #{s.id}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[140px] truncate">
                      {(s.pickup_location || "?").split(",")[0]} →{" "}
                      {(s.delivery_location || "?").split(",")[0]}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                      {s.weight ? `${s.weight}kg` : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`badge ${STATUS_BADGE[s.status] || "badge-gray"}`}
                      >
                        {s.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-600 flex justify-between items-center">
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: "Syne,sans-serif" }}
            >
              Recent Bookings
            </h3>
            <Link
              to="/bookings-list"
              className="font-mono text-[10px] text-slate-500 hover:text-brand-red transition-colors"
            >
              View all →
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">
              No bookings yet
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-dark-800">
                  {["Tracking", "Receiver", "Carrier", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 font-mono border-b border-dark-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, i) => (
                  <tr
                    key={i}
                    className="border-b border-dark-700 hover:bg-dark-700 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-cyan-400 font-bold">
                      {b.tracking_number}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 truncate max-w-[100px]">
                      {b.receiver_name || "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                      {b.carrier || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`badge ${STATUS_BADGE[b.status] || "badge-gray"}`}
                      >
                        {b.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
