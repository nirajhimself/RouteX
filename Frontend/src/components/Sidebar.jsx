import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Squares2X2Icon,
  UsersIcon,
  TruckIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  MapIcon,
  SignalIcon,
  ChartBarIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  SparklesIcon,
  FireIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const NAV = [
  { path: "/", label: "Dashboard", icon: Squares2X2Icon, group: "main" },
  { path: "/booking", label: "Booking", icon: ArchiveBoxIcon, group: "main" },
  { path: "/drivers", label: "Drivers", icon: UsersIcon, group: "main" },
  { path: "/vehicles", label: "Vehicles", icon: TruckIcon, group: "main" },
  {
    path: "/shipments",
    label: "Shipments",
    icon: ArchiveBoxIcon,
    group: "main",
  },
  {
    path: "/warehouses",
    label: "Warehouses",
    icon: BuildingStorefrontIcon,
    group: "main",
  },
  { path: "/inventory", label: "Inventory", icon: CubeIcon, group: "main" },
  {
    path: "/bookings-list",
    label: "All Bookings",
    icon: ClipboardDocumentListIcon,
    group: "main",
  },
  // ✅ Invoices added here with correct group and Heroicon
  {
    path: "/invoices",
    label: "Invoices",
    icon: DocumentTextIcon,
    group: "main",
  },
  { path: "/routes", label: "Routes", icon: MapIcon, group: "ops" },
  { path: "/tracking", label: "Tracking", icon: SignalIcon, group: "ops" },
  { path: "/analytics", label: "Analytics", icon: ChartBarIcon, group: "ops" },
  { path: "/heatmap", label: "Heatmap", icon: FireIcon, group: "ops" },
  {
    path: "/track",
    label: "Track Shipment",
    icon: MagnifyingGlassIcon,
    group: "ops",
  },
  {
    path: "/notifications",
    label: "Notifications",
    icon: BellIcon,
    group: "ops",
  },
  {
    path: "/negotiation",
    label: "AI Negotiate",
    icon: SparklesIcon,
    group: "ops",
  },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  const Content = () => (
    <div className="flex flex-col h-full py-4">
      {/* Logo */}
      <div className="px-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-0 select-none">
          <span
            className="font-display text-2xl font-bold text-slate-100 leading-none"
            style={{ fontFamily: "Syne,sans-serif" }}
          >
            Route
          </span>
          <span
            className="font-display text-2xl font-bold leading-none"
            style={{
              fontFamily: "Syne,sans-serif",
              color: "#e8001d",
              textShadow: "0 0 16px rgba(232,0,29,0.4)",
            }}
          >
            X
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded text-slate-500 hover:text-slate-300"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Operations */}
      <div className="px-2 mb-2">
        <p className="px-2 text-[10px] font-semibold tracking-widest text-slate-600 uppercase mb-1.5 font-mono">
          Operations
        </p>
        {NAV.filter((n) => n.group === "main").map(
          ({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ),
        )}
      </div>

      {/* Intelligence */}
      <div className="px-2">
        <p className="px-2 text-[10px] font-semibold tracking-widest text-slate-600 uppercase mb-1.5 font-mono">
          Intelligence
        </p>
        {NAV.filter((n) => n.group === "ops").map(
          ({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ),
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 pt-4 border-t border-dark-500">
        <div className="bg-dark-700 rounded-lg p-3 border border-dark-500">
          <p className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">
            System
          </p>
          {[
            ["API", "●", "text-emerald-400"],
            ["DB", "●", "text-emerald-400"],
            ["AI", "●", "text-amber-400"],
          ].map(([k, v, c]) => (
            <div key={k} className="flex justify-between text-[11px] mb-1">
              <span className="font-mono text-slate-500">{k}</span>
              <span className={`font-mono ${c}`}>{v} Online</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-mono text-slate-600 mt-3 px-1">
          v2.0.0 · RouteX Core
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-52 bg-dark-900 border-r border-dark-600 fixed top-0 left-0 bottom-0 z-30">
        <Content />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed top-0 left-0 bottom-0 w-52 bg-dark-900 border-r border-dark-600 z-50 lg:hidden"
            >
              <Content />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
