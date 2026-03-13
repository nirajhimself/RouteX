export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
  return (
    <span className={`${s} border-2 border-dark-400 border-t-brand-red rounded-full animate-spin inline-block`} />
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Spinner size="lg" />
      <p className="font-mono text-xs text-slate-600 tracking-wider">{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-red-400 mb-1">Failed to load data</p>
        <p className="text-xs text-slate-600 font-mono max-w-xs">{message || 'Could not reach the backend server. Make sure FastAPI is running on port 8000.'}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-xs">
          ↻ Retry
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      {icon && <div className="text-4xl mb-1">{icon}</div>}
      <p className="text-sm font-semibold text-slate-400">{title}</p>
      {description && <p className="text-xs text-slate-600 font-mono text-center max-w-xs">{description}</p>}
    </div>
  )
}
