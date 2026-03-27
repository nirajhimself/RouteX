import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { COMPANY_ID, API_BASE } from "../config";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="font-mono text-[11px] text-slate-500 hidden sm:block">
      {time.toLocaleTimeString("en-IN", { hour12: false })} IST
    </span>
  );
}

export default function Navbar({ onMenuToggle }) {
  const { dark, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ticker, setTicker] = useState(["Connecting to live data…"]);
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchTicker = useCallback(async () => {
    try {
      const [vRes, sRes, nRes] = await Promise.allSettled([
        fetch(`${API}/live-vehicles/${COMPANY_ID}`),
        fetch(`${API}/shipments/${COMPANY_ID}`),
        fetch(`${API}/notifications/1?unread_only=false`),
      ]);

      const items = [];

      if (vRes.status === "fulfilled" && vRes.value.ok) {
        const vehicles = await vRes.value.json();
        if (Array.isArray(vehicles)) {
          vehicles.forEach((v) => {
            if (v.status === "Moving" && v.speed > 0)
              items.push(
                `${v.vehicle_number} · ${v.speed} km/h · ${v.vehicle_type}`,
              );
            else if (v.has_location)
              items.push(`${v.vehicle_number} · Parked · ${v.vehicle_type}`);
          });
        }
      }

      if (sRes.status === "fulfilled" && sRes.value.ok) {
        const shipments = await sRes.value.json();
        if (Array.isArray(shipments)) {
          const inTransit = shipments.filter(
            (s) => s.status === "In Transit",
          ).length;
          const pending = shipments.filter(
            (s) => s.status === "Pending",
          ).length;
          const delivered = shipments.filter(
            (s) => s.status === "Delivered",
          ).length;
          if (inTransit > 0)
            items.push(
              `${inTransit} shipment${inTransit > 1 ? "s" : ""} in transit`,
            );
          if (pending > 0)
            items.push(`${pending} shipment${pending > 1 ? "s" : ""} queued`);
          if (delivered > 0) items.push(`${delivered} delivered today ✓`);
          const latest = shipments[0];
          if (latest)
            items.push(
              `SHP-${latest.id} · ${latest.pickup_location} → ${latest.delivery_location} · ${latest.status}`,
            );
        }
      }

      if (nRes.status === "fulfilled" && nRes.value.ok) {
        const data = await nRes.value.json();
        const notifs = data.notifications || [];
        notifs
          .slice(0, 4)
          .forEach((n) =>
            items.push(
              n.title + (n.message ? " · " + n.message.slice(0, 40) : ""),
            ),
          );
        setUnread(data.unread_count || 0);
        setAlerts(
          notifs.slice(0, 6).map((n) => ({
            id: n.id,
            msg: n.message || n.title,
            time: timeAgo(n.created_at),
            color:
              n.type === "error"
                ? "#f87171"
                : n.type === "success"
                  ? "#4ade80"
                  : n.type === "warning"
                    ? "#fbbf24"
                    : "#60a5fa",
            is_read: n.is_read,
          })),
        );
      }

      if (items.length === 0) {
        items.push(
          "RouteX AI Logistics Platform · All Systems Go",
          "No active shipments · Add shipments to see live data",
        );
      }

      setTicker(items);
    } catch (e) {
      console.error("Ticker fetch error", e);
    }
  }, []);

  useEffect(() => {
    fetchTicker();
    const id = setInterval(fetchTicker, 15000);
    return () => clearInterval(id);
  }, [fetchTicker]);

  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all/1`, { method: "PATCH" });
      setUnread(0);
      setAlerts((a) => a.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 lg:left-52">
      {/* Main bar */}
      <div className="bg-dark-900 border-b border-dark-600 flex items-center px-4 gap-3 h-[52px]">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded text-slate-400 hover:text-slate-100"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          {searchOpen ? (
            <motion.div
              initial={{ opacity: 0, width: 120 }}
              animate={{ opacity: 1, width: "100%" }}
              className="flex items-center gap-2 bg-dark-700 border border-dark-400 rounded-lg px-3 py-1.5"
            >
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                autoFocus
                onBlur={() => setSearchOpen(false)}
                placeholder="Search shipments, routes, drivers…"
                className="bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none flex-1 min-w-0"
              />
            </motion.div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span className="hidden sm:block">Search…</span>
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LiveClock />

          {/* System status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/8 border border-emerald-500/20 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-400 tracking-wider">
              ALL SYSTEMS GO
            </span>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-dark-700 border border-dark-500 rounded-lg">
            <button
              onClick={toggle}
              className={`p-1.5 rounded-md transition-all ${dark ? "bg-dark-500 text-slate-100" : "text-slate-500"}`}
            >
              <MoonIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggle}
              className={`p-1.5 rounded-md transition-all ${!dark ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
            >
              <SunIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-lg border border-dark-500 text-slate-400 hover:text-slate-100 hover:bg-dark-600 transition-all"
            >
              <BellIcon className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                </span>
              )}
            </button>

            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-11 w-80 bg-dark-800 border border-dark-500 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-2.5 border-b border-dark-600 flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-100">
                    Alerts{" "}
                    {unread > 0 && (
                      <span className="ml-1 text-[10px] bg-brand-red text-white px-1.5 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </span>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-mono text-brand-red hover:opacity-70 tracking-wider"
                    >
                      CLEAR ALL
                    </button>
                  )}
                </div>

                {alerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-600 font-mono">
                    No alerts yet
                  </div>
                ) : (
                  alerts.map((a, i) => (
                    <div
                      key={i}
                      className={`px-4 py-2.5 border-b border-dark-700 flex gap-3 hover:bg-dark-700 cursor-pointer ${!a.is_read ? "bg-dark-750" : ""}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{
                          background: a.color,
                          boxShadow: `0 0 6px ${a.color}`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-snug truncate">
                          {a.msg}
                        </p>
                        <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                          {a.time}
                        </p>
                      </div>
                      {!a.is_read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-dark-600 ml-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white font-mono">
                AK
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Live ticker */}
      <div className="h-6 bg-dark-900/90 border-b border-dark-700 flex items-center overflow-hidden">
        <div className="flex-shrink-0 bg-brand-red px-3 h-full flex items-center">
          <span className="font-mono text-[9px] font-bold text-white tracking-[0.12em]">
            LIVE
          </span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track flex gap-14 whitespace-nowrap">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="font-mono text-[10px] text-slate-500">
                <span className="text-brand-red/60 mr-2">▸</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
