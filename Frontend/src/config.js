// ─── RouteX Configuration ────────────────────────────────────────────────────
// Change COMPANY_ID to match your database record

baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",

export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const POLL_INTERVAL_MS = 5000; // tracking refresh rate
