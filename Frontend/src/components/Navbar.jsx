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
import api from "../api/api"; // ✅ central axios

const COMPANY_ID = 1; // ✅ keep simple (or move to env later)

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

  // ✅ FIXED: using axios instead of fetch
  const fetchTicker = useCallback(async () => {
    try {
      const [vRes, sRes, nRes] = await Promise.all([
        api.get(`/live-vehicles/${COMPANY_ID}`),
        api.get(`/shipments/${COMPANY_ID}`),
        api.get(`/notifications/1?unread_only=false`),
      ]);

      const items = [];

      const vehicles = vRes.data || [];
      vehicles.forEach((v) => {
        if (v.status === "Moving" && v.speed > 0)
          items.push(`${v.vehicle_number} · ${v.speed} km/h`);
        else if (v.has_location) items.push(`${v.vehicle_number} · Parked`);
      });

      const shipments = sRes.data || [];
      const inTransit = shipments.filter(
        (s) => s.status === "In Transit",
      ).length;
      if (inTransit > 0) items.push(`${inTransit} shipments in transit`);

      const notifData = nRes.data || {};
      const notifs = notifData.notifications || [];

      setUnread(notifData.unread_count || 0);
      setAlerts(
        notifs.map((n) => ({
          id: n.id,
          msg: n.message || n.title,
          is_read: n.is_read,
        })),
      );

      if (items.length === 0) {
        items.push("RouteX AI Logistics Platform · All Systems Go");
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

  // ✅ FIXED: mark read
  const markAllRead = async () => {
    try {
      await api.patch(`/notifications/read-all/1`);
      setUnread(0);
      setAlerts((a) => a.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 lg:left-52">
      <div className="bg-dark-900 border-b border-dark-600 flex items-center px-4 gap-3 h-[52px]">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded text-slate-400 hover:text-slate-100"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-sm">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span className="hidden sm:block">Search…</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LiveClock />

          {/* Theme */}
          <button onClick={toggle}>
            {dark ? (
              <SunIcon className="w-4 h-4" />
            ) : (
              <MoonIcon className="w-4 h-4" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen((o) => !o)}>
              <BellIcon className="w-4 h-4" />
              {unread > 0 && <span>{unread}</span>}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-10 bg-dark-800 p-3">
                <button onClick={markAllRead}>Clear All</button>
                {alerts.map((a) => (
                  <div key={a.id}>{a.msg}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ticker */}
      <div className="h-6 bg-dark-900 flex items-center overflow-hidden">
        <div className="overflow-hidden flex-1">
          <div className="flex gap-10 whitespace-nowrap">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
