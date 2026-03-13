import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'
import {
  Bars3Icon, BellIcon, MagnifyingGlassIcon,
  SunIcon, MoonIcon, UserCircleIcon,
} from '@heroicons/react/24/outline'

const TICKER = [
  'SHP-8821 · Mumbai → Delhi · IN TRANSIT',
  'TRK-019 · 67 km/h · RT-41',
  'FUEL ALERT: TRK-007 low',
  'RT-38 optimized · −34 km saved',
  'WH-001 at 78% capacity',
  'SHP-8820 · Delivered ✓',
  '3 new shipments queued',
  'AI Model: All systems nominal',
]

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(i)
  }, [])
  return (
    <span className="font-mono text-[11px] text-slate-500 hidden sm:block">
      {time.toLocaleTimeString('en-IN', { hour12: false })} IST
    </span>
  )
}

export default function Navbar({ onMenuToggle }) {
  const { dark, toggle } = useTheme()
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const alerts = [
    { msg: 'SHP-8821 reached checkpoint 3', time: '2m', color: '#60a5fa' },
    { msg: 'TRK-007 fuel critically low', time: '15m', color: '#f87171' },
    { msg: 'Route RT-41 saved 34 km', time: '1h', color: '#4ade80' },
    { msg: 'Driver Arjun Kumar on leave', time: '3h', color: '#fbbf24' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-20 lg:left-52">
      {/* Main bar */}
      <div className="h-13 bg-dark-900 dark:bg-dark-900 light:bg-white border-b border-dark-600 dark:border-dark-600 light:border-slate-200 flex items-center px-4 gap-3 h-[52px]">
        <button onClick={onMenuToggle} className="lg:hidden p-1.5 rounded text-slate-400 hover:text-slate-100">
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          {searchOpen ? (
            <motion.div initial={{ opacity: 0, width: 120 }} animate={{ opacity: 1, width: '100%' }}
              className="flex items-center gap-2 bg-dark-700 dark:bg-dark-700 light:bg-slate-100 border border-dark-400 dark:border-dark-400 light:border-slate-200 rounded-lg px-3 py-1.5">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input autoFocus onBlur={() => setSearchOpen(false)}
                placeholder="Search shipments, routes, drivers…"
                className="bg-transparent text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder-slate-500 outline-none flex-1 min-w-0" />
            </motion.div>
          ) : (
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span className="hidden sm:block">Search…</span>
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LiveClock />

          {/* System status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/8 border border-emerald-500/20 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="font-mono text-[10px] text-emerald-400 tracking-wider">ALL SYSTEMS GO</span>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-dark-700 dark:bg-dark-700 light:bg-slate-100 border border-dark-500 dark:border-dark-500 light:border-slate-200 rounded-lg">
            <button onClick={() => toggle()} title="Dark"
              className={`p-1.5 rounded-md transition-all ${dark ? 'bg-dark-500 text-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>
              <MoonIcon className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => toggle()} title="Light"
              className={`p-1.5 rounded-md transition-all ${!dark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
              <SunIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen(o => !o)}
              className="relative p-2 rounded-lg border border-dark-500 dark:border-dark-500 light:border-slate-200 text-slate-400 hover:text-slate-100 hover:bg-dark-600 transition-all">
              <BellIcon className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-red rounded-full" style={{boxShadow:'0 0 6px rgba(232,0,29,0.8)'}} />
            </button>
            {notifOpen && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-11 w-72 bg-dark-800 dark:bg-dark-800 light:bg-white border border-dark-500 dark:border-dark-500 light:border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-2.5 border-b border-dark-600 dark:border-dark-600 light:border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900">Alert Feed</span>
                  <button className="text-[10px] font-mono text-brand-red hover:opacity-70 tracking-wider">CLEAR ALL</button>
                </div>
                {alerts.map((a, i) => (
                  <div key={i} className="px-4 py-2.5 border-b border-dark-700 dark:border-dark-700 light:border-slate-50 flex gap-3 hover:bg-dark-700 dark:hover:bg-dark-700 light:hover:bg-slate-50 cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
                    <div>
                      <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-snug">{a.msg}</p>
                      <p className="text-[10px] font-mono text-slate-600 mt-0.5">{a.time} ago</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-dark-600 dark:border-dark-600 light:border-slate-200 ml-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white font-mono">AK</span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">Admin</span>
          </div>
        </div>
      </div>

      {/* Live ticker */}
      <div className="h-6 bg-dark-900/90 dark:bg-dark-900/90 light:bg-slate-50/90 border-b border-dark-700 dark:border-dark-700 light:border-slate-200 flex items-center overflow-hidden">
        <div className="flex-shrink-0 bg-brand-red px-3 h-full flex items-center">
          <span className="font-mono text-[9px] font-bold text-white tracking-[0.12em]">LIVE</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track flex gap-14 whitespace-nowrap">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="font-mono text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400">
                <span className="text-brand-red/60 mr-2">▸</span>{t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
