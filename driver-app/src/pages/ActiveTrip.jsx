import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000";

const STEPS = ["Pending", "In Transit", "Delivered"];

export default function ActiveTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { driver } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);
  const [gps, setGps] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [proof, setProof] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef();
  const gpsTimer = useRef();

  useEffect(() => {
    fetchTrip();
    return () => clearInterval(gpsTimer.current);
  }, [id]);

  async function fetchTrip() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/driver/${driver.id}/shipments`);
      const data = await r.json();
      const t = data.find((s) => String(s.id) === String(id));
      setTrip(t || null);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  // ── GPS tracking ─────────────────────────────────────────────────────────
  function startTracking() {
    if (!navigator.geolocation)
      return showToast("GPS not supported on this device", "error");
    setTracking(true);
    const push = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGps({ lat: latitude, lng: longitude });
          fetch(`${API}/update-location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicle_id: `driver-${driver.id}`,
              latitude,
              longitude,
              speed: pos.coords.speed || 0,
            }),
          });
        },
        () => {},
        { enableHighAccuracy: true },
      );
    };
    push();
    gpsTimer.current = setInterval(push, 15000); // push every 15s
    showToast("GPS tracking started", "success");
  }

  function stopTracking() {
    clearInterval(gpsTimer.current);
    setTracking(false);
    showToast("GPS tracking stopped");
  }

  // ── Status update ─────────────────────────────────────────────────────────
  async function updateStatus(status) {
    setUpdating(true);
    try {
      await fetch(`${API}/shipment/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTrip((t) => ({ ...t, status }));
      showToast(`Marked as ${status}`, "success");
      if (status === "In Transit" && !tracking) startTracking();
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  }

  // ── Proof upload ──────────────────────────────────────────────────────────
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProof(reader.result);
    reader.readAsDataURL(file);
  }

  async function uploadProof() {
    if (!proof) return showToast("Select a photo first", "error");
    setUpdating(true);
    try {
      await fetch(`${API}/shipment/${id}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: proof }),
      });
      setTrip((t) => ({ ...t, status: "Delivered", has_proof: true }));
      stopTracking();
      showToast("Proof uploaded! Trip completed ✓", "success");
      setConfirm(false);
      setTimeout(() => navigate("/"), 2000);
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUpdating(false);
    }
  }

  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (loading)
    return (
      <div className="spinner" style={{ paddingTop: 120 }}>
        <div className="spin" />
        Loading trip...
      </div>
    );
  if (!trip)
    return (
      <div className="empty" style={{ paddingTop: 120 }}>
        <div className="empty-icon">❓</div>
        <div style={{ fontWeight: 700 }}>Trip not found</div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 16, width: "auto" }}
          onClick={() => navigate("/")}
        >
          ← Back
        </button>
      </div>
    );

  const stepIdx = STEPS.indexOf(trip.status);
  const isActive = trip.status === "In Transit";
  const isDone = trip.status === "Delivered";

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: "8px 12px",
            color: "#f0f0f0",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ←
        </button>
        <div>
          <div
            style={{
              fontSize: 12,
              color: "#555",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Trip #{trip.id}
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 22,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Active Trip
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span
            className={`badge ${trip.status === "Delivered" ? "badge-delivered" : trip.status === "In Transit" ? "badge-transit" : "badge-pending"}`}
          >
            {trip.status}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Progress stepper */}
        <div className="card">
          <div
            style={{
              fontSize: 12,
              color: "#555",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            Progress
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div
                key={step}
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
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: i <= stepIdx ? "#e8001d" : "#1e293b",
                      border: `2px solid ${i <= stepIdx ? "#e8001d" : "#333"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: i <= stepIdx ? "#fff" : "#555",
                      transition: "all 0.3s",
                    }}
                  >
                    {i < stepIdx ? "✓" : i + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: i <= stepIdx ? "#f0f0f0" : "#555",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: i < stepIdx ? "#e8001d" : "#1e293b",
                      margin: "0 6px",
                      marginBottom: 20,
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Route card */}
        <div className="card">
          <div
            style={{
              fontSize: 12,
              color: "#555",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 14,
            }}
          >
            Route Details
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#1a2a1a",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                📍
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#555",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Pickup
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                  {trip.pickup_location}
                </div>
              </div>
            </div>
            <div
              style={{
                width: 2,
                height: 20,
                background: "#1e293b",
                marginLeft: 17,
              }}
            />
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#2a1a0a",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                🏁
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#555",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Delivery
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                  {trip.delivery_location}
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid #1e293b",
            }}
          >
            <div style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Weight
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#e8001d",
                  marginTop: 2,
                }}
              >
                {trip.weight} kg
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Proof
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: trip.has_proof ? "#22c55e" : "#555",
                  marginTop: 2,
                }}
              >
                {trip.has_proof ? "✓ Done" : "Pending"}
              </div>
            </div>
          </div>
        </div>

        {/* GPS tracker */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#555",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              GPS Tracking
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: tracking ? "#22c55e" : "#555",
                  boxShadow: tracking ? "0 0 8px #22c55e" : "none",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: tracking ? "#22c55e" : "#555",
                  fontWeight: 700,
                }}
              >
                {tracking ? "Live" : "Off"}
              </span>
            </div>
          </div>
          {gps && (
            <div
              style={{
                background: "#020617",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 12,
                fontSize: 13,
                color: "#888",
              }}
            >
              📍 {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
            </div>
          )}
          <button
            className={`btn ${tracking ? "btn-ghost" : "btn-primary"}`}
            onClick={tracking ? stopTracking : startTracking}
            disabled={isDone}
          >
            {tracking ? "⏹ Stop Tracking" : "▶ Start GPS Tracking"}
          </button>
        </div>

        {/* Action buttons */}
        {!isDone && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trip.status === "Pending" && (
              <button
                className="btn btn-primary"
                style={{ height: 54, fontSize: 16 }}
                onClick={() => updateStatus("In Transit")}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <div className="spin" style={{ borderTopColor: "#fff" }} />{" "}
                    Updating...
                  </>
                ) : (
                  "🚛 Start Trip"
                )}
              </button>
            )}
            {trip.status === "In Transit" && (
              <button
                className="btn btn-green"
                style={{ height: 54, fontSize: 16 }}
                onClick={() => setConfirm(true)}
                disabled={updating}
              >
                📦 Mark as Delivered
              </button>
            )}
          </div>
        )}

        {isDone && (
          <div
            style={{
              background: "#052e16",
              border: "1px solid #166534",
              borderRadius: 14,
              padding: 20,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div
              style={{
                color: "#22c55e",
                fontWeight: 800,
                fontSize: 18,
                fontFamily: "'Barlow Condensed',sans-serif",
                textTransform: "uppercase",
              }}
            >
              Trip Completed!
            </div>
            <div style={{ color: "#4ade80", fontSize: 13, marginTop: 4 }}>
              Great work. Proof has been uploaded.
            </div>
          </div>
        )}
      </div>

      {/* Delivery confirmation modal */}
      {confirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "20px 20px 0 0",
              padding: 24,
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 24,
                fontWeight: 800,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Confirm Delivery
            </div>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
              Upload a proof photo to complete this trip.
            </p>

            {/* Photo upload */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            {proof ? (
              <div style={{ position: "relative", marginBottom: 16 }}>
                <img
                  src={proof}
                  alt="proof"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    maxHeight: 200,
                    objectFit: "cover",
                  }}
                />
                <button
                  onClick={() => setProof(null)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(0,0,0,0.7)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="btn btn-ghost"
                style={{ marginBottom: 16 }}
                onClick={() => fileRef.current.click()}
              >
                📷 Take / Upload Photo
              </button>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-green"
                style={{ flex: 2 }}
                onClick={uploadProof}
                disabled={updating || !proof}
              >
                {updating ? (
                  <>
                    <div className="spin" style={{ borderTopColor: "#fff" }} />{" "}
                    Uploading...
                  </>
                ) : (
                  "✓ Confirm Delivery"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
