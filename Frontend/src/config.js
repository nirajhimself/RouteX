// ─── RouteX Configuration (CLEAN VERSION) ───────────────────────────────────

// ✅ Use numeric company id (must match DB)
export const COMPANY_ID = 1;

// ✅ API base URL (works for both local + production)
export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ✅ Polling interval
export const POLL_INTERVAL_MS = 5000;
