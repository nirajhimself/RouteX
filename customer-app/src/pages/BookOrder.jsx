import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../config";
const CID = "demo-company";

const STEPS = ["Shipment Details", "Select Carrier", "Confirm & Book"];

function fmt(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const initialForm = {
  // Sender
  sender_name: "",
  sender_address: "",
  sender_city: "",
  sender_pincode: "",
  // Receiver
  receiver_name: "",
  receiver_phone: "",
  receiver_address: "",
  receiver_city: "",
  receiver_pincode: "",
  // Package
  product_name: "",
  description: "",
  weight_kg: "",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  declared_value: "",
};

export default function BookOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [rates, setRates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  // ── Validate step 1 ──────────────────────────────────────────────────────
  function validateStep1() {
    const e = {};
    if (!form.sender_name.trim()) e.sender_name = "Required";
    if (!form.sender_city.trim()) e.sender_city = "Required";
    if (!form.receiver_name.trim()) e.receiver_name = "Required";
    if (!form.receiver_address.trim()) e.receiver_address = "Required";
    if (!form.receiver_city.trim()) e.receiver_city = "Required";
    if (!form.receiver_pincode.trim()) e.receiver_pincode = "Required";
    if (!form.weight_kg || parseFloat(form.weight_kg) <= 0)
      e.weight_kg = "Enter valid weight";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Fetch carrier rates ──────────────────────────────────────────────────
  async function fetchRates() {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/carrier-rates?weight=${form.weight_kg}&destination=${form.receiver_city}&origin=${form.sender_city || "Mumbai"}`,
      );
      const data = await r.json();
      setRates(data.rates || []);
      setStep(1);
    } catch {
      showToast("Failed to fetch rates. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Confirm booking ───────────────────────────────────────────────────────
  async function confirmBooking() {
    if (!selected) return showToast("Please select a carrier first", "error");
    setLoading(true);
    try {
      const payload = {
        company_id: CID,
        booking_type: "B2C",
        sender_name: form.sender_name,
        sender_address: form.sender_address,
        sender_city: form.sender_city,
        sender_pincode: form.sender_pincode,
        receiver_name: form.receiver_name,
        receiver_phone: form.receiver_phone,
        receiver_address: form.receiver_address,
        receiver_city: form.receiver_city,
        receiver_pincode: form.receiver_pincode,
        product_name: form.product_name || "Shipment",
        description: form.description,
        weight_kg: parseFloat(form.weight_kg),
        length_cm: form.length_cm ? parseFloat(form.length_cm) : null,
        width_cm: form.width_cm ? parseFloat(form.width_cm) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        declared_value: form.declared_value
          ? parseFloat(form.declared_value)
          : null,
        carrier: selected.carrier,
        service_type: selected.service_type,
        carrier_rate: selected.rate,
        estimated_days: selected.estimated_days,
      };
      const r = await fetch(`${API}/bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Booking failed");
      const data = await r.json();
      setBooking(data);
      setStep(2);
    } catch (err) {
      showToast(err.message || "Booking failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Carrier colors ────────────────────────────────────────────────────────
  const CARRIER_COLOR = {
    Delhivery: "#60a5fa",
    DTDC: "#f97316",
    DHL: "#fbbf24",
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="container page" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          Book a Shipment
        </h1>
        <p style={{ color: "#64748b" }}>Fast, reliable delivery across India</p>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < STEPS.length - 1 ? 1 : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background:
                    i < step ? "#22c55e" : i === step ? "#e8001d" : "#1e293b",
                  border: `2px solid ${i < step ? "#22c55e" : i === step ? "#e8001d" : "#334155"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                  transition: "all 0.3s",
                }}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: i <= step ? "#f1f5f9" : "#475569",
                  whiteSpace: "nowrap",
                }}
              >
                {s}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: i < step ? "#22c55e" : "#1e293b",
                  margin: "0 8px",
                  marginBottom: 22,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Shipment Details ── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Sender */}
          <div className="card">
            <div style={s.sectionTitle}>📍 Sender Details</div>
            <div style={s.grid2}>
              <Field
                label="Sender Name *"
                value={form.sender_name}
                onChange={(v) => set("sender_name", v)}
                error={errors.sender_name}
                placeholder="Your name"
              />
              <Field
                label="City *"
                value={form.sender_city}
                onChange={(v) => set("sender_city", v)}
                error={errors.sender_city}
                placeholder="e.g. Mumbai"
              />
              <Field
                label="Address"
                value={form.sender_address}
                onChange={(v) => set("sender_address", v)}
                placeholder="Street address"
              />
              <Field
                label="Pincode"
                value={form.sender_pincode}
                onChange={(v) => set("sender_pincode", v)}
                placeholder="400001"
              />
            </div>
          </div>

          {/* Receiver */}
          <div className="card">
            <div style={s.sectionTitle}>🏁 Receiver Details</div>
            <div style={s.grid2}>
              <Field
                label="Receiver Name *"
                value={form.receiver_name}
                onChange={(v) => set("receiver_name", v)}
                error={errors.receiver_name}
                placeholder="Receiver's full name"
              />
              <Field
                label="Phone"
                value={form.receiver_phone}
                onChange={(v) => set("receiver_phone", v)}
                placeholder="10-digit number"
              />
              <Field
                label="Address *"
                value={form.receiver_address}
                onChange={(v) => set("receiver_address", v)}
                error={errors.receiver_address}
                placeholder="Street address"
                style={{ gridColumn: "1/-1" }}
              />
              <Field
                label="City *"
                value={form.receiver_city}
                onChange={(v) => set("receiver_city", v)}
                error={errors.receiver_city}
                placeholder="e.g. Delhi"
              />
              <Field
                label="Pincode *"
                value={form.receiver_pincode}
                onChange={(v) => set("receiver_pincode", v)}
                error={errors.receiver_pincode}
                placeholder="110001"
              />
            </div>
          </div>

          {/* Package */}
          <div className="card">
            <div style={s.sectionTitle}>📦 Package Details</div>
            <div style={s.grid2}>
              <Field
                label="Product Name"
                value={form.product_name}
                onChange={(v) => set("product_name", v)}
                placeholder="e.g. Electronics"
              />
              <Field
                label="Weight (kg) *"
                value={form.weight_kg}
                onChange={(v) => set("weight_kg", v)}
                error={errors.weight_kg}
                placeholder="e.g. 2.5"
                type="number"
              />
              <Field
                label="Length (cm)"
                value={form.length_cm}
                onChange={(v) => set("length_cm", v)}
                placeholder="Optional"
                type="number"
              />
              <Field
                label="Width (cm)"
                value={form.width_cm}
                onChange={(v) => set("width_cm", v)}
                placeholder="Optional"
                type="number"
              />
              <Field
                label="Height (cm)"
                value={form.height_cm}
                onChange={(v) => set("height_cm", v)}
                placeholder="Optional"
                type="number"
              />
              <Field
                label="Declared Value ₹"
                value={form.declared_value}
                onChange={(v) => set("declared_value", v)}
                placeholder="Optional"
                type="number"
              />
              <Field
                label="Description"
                value={form.description}
                onChange={(v) => set("description", v)}
                placeholder="Brief description"
                style={{ gridColumn: "1/-1" }}
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ height: 52, fontSize: 16 }}
            onClick={fetchRates}
            disabled={loading}
          >
            {loading ? (
              <>
                <div
                  className="spin"
                  style={{ borderTopColor: "#fff", width: 18, height: 18 }}
                />
                Fetching rates…
              </>
            ) : (
              "Get Carrier Rates →"
            )}
          </button>
        </div>
      )}

      {/* ── STEP 1: Select Carrier ── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              gap: 16,
              fontSize: 13,
              color: "#94a3b8",
            }}
          >
            <span>
              📍{" "}
              <b style={{ color: "#f1f5f9" }}>{form.sender_city || "Origin"}</b>
            </span>
            <span style={{ color: "#e8001d" }}>→</span>
            <span>
              🏁 <b style={{ color: "#f1f5f9" }}>{form.receiver_city}</b>
            </span>
            <span style={{ marginLeft: "auto" }}>⚖️ {form.weight_kg} kg</span>
          </div>

          <p style={{ color: "#64748b", fontSize: 14 }}>
            {rates.length} options available — sorted by price
          </p>

          {rates.map((rate, i) => {
            const color = CARRIER_COLOR[rate.carrier] || "#94a3b8";
            const isChosen =
              selected?.carrier === rate.carrier &&
              selected?.service_type === rate.service_type;
            return (
              <div
                key={i}
                onClick={() => setSelected(rate)}
                style={{
                  background: isChosen ? "#0c1a2e" : "#0f172a",
                  border: `2px solid ${isChosen ? "#3b82f6" : "#1e293b"}`,
                  borderRadius: 14,
                  padding: 20,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {i === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 14,
                      background: "#052e16",
                      color: "#4ade80",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    CHEAPEST
                  </div>
                )}
                {rate.estimated_days === 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 14,
                      background: "#0d1f3c",
                      color: "#60a5fa",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    FASTEST
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      {rate.logo}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: "#f1f5f9",
                        }}
                      >
                        {rate.carrier}
                      </div>
                      <div
                        style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}
                      >
                        {rate.service_type}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontSize: 24,
                        fontWeight: 800,
                        color,
                      }}
                    >
                      {fmt(rate.rate)}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}
                    >
                      {rate.estimated_days === 1
                        ? "Next day"
                        : `${rate.estimated_days} days`}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 14,
                    flexWrap: "wrap",
                  }}
                >
                  {(rate.features || []).map((f) => (
                    <span
                      key={f}
                      style={{
                        background: "#1e293b",
                        color: "#94a3b8",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                      }}
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>

                {isChosen && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid #1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#4ade80",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: "#4ade80",
                        fontWeight: 600,
                      }}
                    >
                      Selected
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => {
                setStep(0);
                setSelected(null);
              }}
            >
              ← Back
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, height: 52 }}
              onClick={() => {
                if (!selected)
                  return showToast("Select a carrier first", "error");
                setStep(2);
              }}
              disabled={!selected}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Confirm or Success ── */}
      {step === 2 && !booking && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div style={s.sectionTitle}>Order Summary</div>

            {/* Route */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 8,
                alignItems: "center",
                background: "#020617",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  From
                </div>
                <div style={{ fontWeight: 700 }}>{form.sender_name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {form.sender_city}
                </div>
              </div>
              <div
                style={{ color: "#e8001d", fontSize: 20, textAlign: "center" }}
              >
                →
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  To
                </div>
                <div style={{ fontWeight: 700 }}>{form.receiver_name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {form.receiver_city}
                </div>
              </div>
            </div>

            {/* Carrier */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <span style={{ color: "#64748b", fontSize: 14 }}>Carrier</span>
              <span style={{ fontWeight: 600 }}>
                {selected?.carrier} — {selected?.service_type}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <span style={{ color: "#64748b", fontSize: 14 }}>
                Est. Delivery
              </span>
              <span style={{ fontWeight: 600 }}>
                {selected?.estimated_days} business days
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <span style={{ color: "#64748b", fontSize: 14 }}>Weight</span>
              <span style={{ fontWeight: 600 }}>{form.weight_kg} kg</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px 0 0",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                Total Charges
              </span>
              <span
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#4ade80",
                }}
              >
                {fmt(selected?.rate)}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, height: 52, fontSize: 16 }}
              onClick={confirmBooking}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div
                    className="spin"
                    style={{ borderTopColor: "#fff", width: 18, height: 18 }}
                  />
                  Booking…
                </>
              ) : (
                "✓ Confirm Booking"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {step === 2 && booking && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#052e16",
              border: "2px solid #22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            ✅
          </div>
          <div>
            <h2
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: "#4ade80",
                marginBottom: 8,
              }}
            >
              Booking Confirmed!
            </h2>
            <p style={{ color: "#64748b", fontSize: 15 }}>
              Your shipment has been booked successfully.
            </p>
          </div>

          <div className="card" style={{ width: "100%", textAlign: "left" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <span style={{ color: "#64748b", fontSize: 14 }}>
                Tracking Number
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "#60a5fa",
                  fontSize: 16,
                }}
              >
                {booking.tracking_number}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <span style={{ color: "#64748b", fontSize: 14 }}>Carrier</span>
              <span style={{ fontWeight: 600 }}>
                {booking.carrier} — {booking.service_type}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <span style={{ color: "#64748b", fontSize: 14 }}>
                Est. Delivery
              </span>
              <span style={{ fontWeight: 600 }}>
                {booking.estimated_days} business days
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
              }}
            >
              <span style={{ color: "#64748b", fontSize: 14 }}>Amount</span>
              <span style={{ fontWeight: 700, color: "#4ade80" }}>
                {fmt(booking.carrier_rate)}
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#0c1a2e",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: "14px 20px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>💡</span>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              Save your tracking number to track your shipment anytime.
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() =>
                navigate(`/track?number=${booking.tracking_number}`)
              }
            >
              Track Shipment
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                setStep(0);
                setForm(initialForm);
                setSelected(null);
                setBooking(null);
              }}
            >
              Book Another
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

// ── Reusable Field component ─────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  style = {},
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </label>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ borderColor: error ? "#ef4444" : undefined }}
      />
      {error && <span style={{ fontSize: 12, color: "#f87171" }}>{error}</span>}
    </div>
  );
}

const s = {
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#f1f5f9",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
};
