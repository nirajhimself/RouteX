import { useState } from 'react'
import { motion } from 'framer-motion'
import { MagnifyingGlassIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function Table({ columns, data = [], filters = [], onAction, title, action }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = data.filter(row => {
    const matchesSearch = search === '' || Object.values(row).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = filter === 'All' || row.status === filter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-600 dark:border-dark-600 light:border-slate-100 flex flex-wrap items-center gap-3">
        {title && <h3 className="text-sm font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900 font-display mr-2" style={{fontFamily:'Syne,sans-serif'}}>{title}</h3>}

        {/* Search */}
        <div className="flex items-center gap-2 bg-dark-700 dark:bg-dark-700 light:bg-slate-100 border border-dark-500 dark:border-dark-500 light:border-slate-200 rounded-lg px-3 py-1.5 flex-1 min-w-[160px] max-w-xs">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search…"
            className="bg-transparent text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 placeholder-slate-500 outline-none flex-1" />
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex items-center gap-1.5">
            <FunnelIcon className="w-3.5 h-3.5 text-slate-500" />
            {['All', ...filters].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1) }}
                className={`px-2.5 py-1 rounded text-[10px] font-semibold font-mono tracking-wide transition-all
                  ${filter === f
                    ? 'bg-brand-red/15 text-brand-red border border-brand-red/30'
                    : 'text-slate-500 hover:text-slate-300 border border-dark-500 dark:border-dark-500 light:border-slate-200 hover:border-dark-300'}`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {action && <div className="ml-auto">{action}</div>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-800 dark:bg-dark-800 light:bg-slate-50">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 font-mono whitespace-nowrap border-b border-dark-600 dark:border-dark-600 light:border-slate-100">
                  {col.label}
                </th>
              ))}
              {onAction && <th className="px-4 py-2.5 border-b border-dark-600 dark:border-dark-600 light:border-slate-100" />}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-slate-500">
                  No records found
                </td>
              </tr>
            ) : paginated.map((row, i) => (
              <motion.tr key={i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-dark-700 dark:border-dark-700 light:border-slate-50 hover:bg-dark-700 dark:hover:bg-dark-700 light:hover:bg-slate-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm">
                    {col.render ? col.render(row[col.key], row) : (
                      <span className={col.mono ? 'font-mono text-xs' : ''}>{row[col.key] ?? '—'}</span>
                    )}
                  </td>
                ))}
                {onAction && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {onAction(row)}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-2.5 border-t border-dark-700 dark:border-dark-700 light:border-slate-100 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-600">
          {filtered.length} RECORDS · PAGE {page}/{totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-6 h-6 rounded text-[11px] font-mono transition-all
                ${page === p ? 'bg-brand-red text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-dark-600'}`}>
              {p}
            </button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
