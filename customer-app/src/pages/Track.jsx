import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const API = "http://localhost:8000";

const STATUS_STEPS = [
  "Booked",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

const STATUS_MAP = {
  Booked: { step: 0, cls: "badge-booked", color: "#e8001d" },
  "Picked Up": { step: 1, cls: "badge-pending", color: "#eab308" },
  "In Transit": { step: 2, cls: "badge-transit", color: "#3b82f6" },
  "Out for Delivery": { step: 3, cls: "badge-pending", color: "#f97316" },
  Delivered: { step: 4, cls: "badge-delivered", color: "#22c55e" },
};

export default function Track() {
  const [params] = useSearchParams();
  const [number, setNumber] = useState(params.get("number") || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.get("number")) handleTrack(params.get("number"));
  }, []);

  async function handleTrack(num) {
    const n = (num || number).trim();
    if (!n) return setError("Enter a tracking number");
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${API}/booking/track/${n}`);
      if (!r.ok)
        throw new Error(
          "Tracking number not found. Please check and try again.",
        );
      setResult(await r.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const st = result
    ? STATUS_MAP[result.status] || {
        step: 0,
        cls: "badge-booked",
        color: "#e8001d",
      }
    : null;

  return (
    <div className="container page">
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Track Shipment
        </h1>
        <p style={{ color: "#64748b", marginBottom: 28 }}>
          Enter your tracking number below
        </p>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <input
            className="input"
            placeholder="e.g. DLV1234567890"
            value={number}
            onChange={(e) => {
              setNumber(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleTrack()}
            disabled={loading}
            style={{ width: "auto", padding: "13px 24px", flexShrink: 0 }}
          >
            {loading ? (
              <div
                className="spin"
                style={{ borderTopColor: "#fff", width: 16, height: 16 }}
              />
            ) : (
              "Track"
            )}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#1f0a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 12,
              padding: "14px 16px",
              color: "#f87171",
              marginBottom: 24,
            }}
          >
            ✕ {error}
          </div>
        )}

        {loading && (
          <div className="spinner">
            <div className="spin" />
            Looking up tracking info…
          </div>
        )}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status card */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 4,
                    }}
                  >
                    Tracking Number
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#f1f5f9",
                    }}
                  >
                    {result.tracking_number}
                  </div>
                </div>
                <span className={`badge ${st.cls}`}>{result.status}</span>
              </div>

              {/* Progress stepper */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "8px 0 4px",
                }}
              >
                {STATUS_STEPS.map((step, i) => (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: i < STATUS_STEPS.length - 1 ? 1 : 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: i <= st.step ? st.color : "#1e293b",
                          border: `2px solid ${i <= st.step ? st.color : "#334155"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: i <= st.step ? "#fff" : "#475569",
                          transition: "all 0.3s",
                          flexShrink: 0,
                        }}
                      >
                        {i < st.step ? "✓" : i + 1}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: i <= st.step ? "#94a3b8" : "#475569",
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        {step === "Out for Delivery" ? "Out for Del." : step}
                      </div>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          background: i < st.step ? st.color : "#1e293b",
                          margin: "0 4px",
                          marginBottom: 22,
                          transition: "background 0.3s",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shipment details */}
            <div className="card">
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 16,
                }}
              >
                Shipment Details
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {[
                  { label: "Receiver", value: result.receiver_name },
                  { label: "Destination", value: result.receiver_city },
                  { label: "Carrier", value: result.carrier },
                  { label: "Service", value: result.service_type },
                  {
                    label: "Est. Delivery",
                    value: `${result.estimated_days} business days`,
                  },
                  { label: "Product", value: result.product_name || "—" },
                  {
                    label: "Booked On",
                    value: result.created_at?.slice(0, 10),
                  },
                ].map((d) => (
                  <div key={d.label}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 4,
                      }}
                    >
                      {d.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#e2e8f0",
                      }}
                    >
                      {d.value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 16,
                }}
              >
                Timeline
              </div>
              {[
                {
                  date: result.created_at?.slice(0, 16).replace("T", " "),
                  event: "Booking created",
                  done: true,
                },
                {
                  date: result.status !== "Booked" ? "—" : "Pending",
                  event: "Picked up from sender",
                  done: result.status !== "Booked",
                },
                {
                  date: [
                    "In Transit",
                    "Out for Delivery",
                    "Delivered",
                  ].includes(result.status)
                    ? "—"
                    : "Pending",
                  event: "In transit to destination",
                  done: [
                    "In Transit",
                    "Out for Delivery",
                    "Delivered",
                  ].includes(result.status),
                },
                {
                  date: result.status === "Delivered" ? "—" : "Pending",
                  event: "Delivered to receiver",
                  done: result.status === "Delivered",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    paddingBottom: 16,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: t.done ? "#22c55e" : "#1e293b",
                        border: `2px solid ${t.done ? "#22c55e" : "#334155"}`,
                        flexShrink: 0,
                        marginTop: 3,
                      }}
                    />
                    {i < 3 && (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          background: "#1e293b",
                          margin: "4px 0",
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: t.done ? "#f1f5f9" : "#475569",
                      }}
                    >
                      {t.event}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#475569", marginTop: 2 }}
                    >
                      {t.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="empty">
            <div style={{ fontSize: 48 }}>📦</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Enter a tracking number
            </div>
            <div style={{ fontSize: 13 }}>
              Your shipment details will appear here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
