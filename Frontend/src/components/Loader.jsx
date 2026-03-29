export function Spinner({ size = "md" }) {
  const s = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";
  return (
    <span
      className={`${s} border-2 border-dark-400 border-t-brand-red rounded-full animate-spin inline-block`}
    />
  );
}

export function PageLoader({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Spinner size="lg" />
      <p className="font-mono text-xs text-slate-600 tracking-wider">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-red-400 mb-1">
          Failed to load data
        </p>
        <p className="text-xs text-slate-600 font-mono max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-mono text-slate-400 border border-dark-500 px-3 py-1.5 rounded-lg"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      {icon && <div className="text-4xl mb-1">{icon}</div>}
      <p className="text-sm font-semibold text-slate-400">{title}</p>
      {description && (
        <p className="text-xs text-slate-600 font-mono text-center max-w-xs">
          {description}
        </p>
      )}
    </div>
  );
}
 
