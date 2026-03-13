import { motion } from "framer-motion";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeUp,
  accent = "#e8001d",
  sub,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="stat-card group"
    >
      {/* Glow blob — hidden in light mode */}
      <div
        className="glow-blob absolute -top-6 -right-6 w-24 h-24 rounded-full
                   opacity-15 blur-2xl transition-opacity group-hover:opacity-25 pointer-events-none"
        style={{ background: accent }}
      />

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className="stat-value text-3xl font-bold leading-none mb-1"
            style={{ color: accent, fontFamily: "Syne, sans-serif" }}
          >
            {value}
          </p>
          <p className="stat-title text-xs font-semibold">{title}</p>
          {sub && <p className="stat-sub mt-0.5">{sub}</p>}
        </div>

        {/* Change badge */}
        {change && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-semibold font-mono
              px-1.5 py-0.5 rounded-lg flex-shrink-0
              ${
                changeUp
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : "text-red-400 bg-red-500/10 border border-red-500/20"
              }`}
          >
            {changeUp ? (
              <ArrowUpIcon className="w-2.5 h-2.5" />
            ) : (
              <ArrowDownIcon className="w-2.5 h-2.5" />
            )}
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}
