export function getErrorMessage(err, fallback = "Something went wrong") {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((d) => d.msg || String(d)).join(", ");
  if (typeof detail === "object") return JSON.stringify(detail);
  return fallback;
}
