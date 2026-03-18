import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000";

export default function Home() {
  const { customer, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!tracking.trim()) return setError("Enter a tracking number");
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/booking/track/${tracking.trim()}`);
      if (!r.ok) throw new Error("Tracking number not found");
      navigate(`/track?number=${tracking.trim()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)",
          borderBottom: "1px solid #1e293b",
          padding: "80px 24px 60px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "10%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(232,0,29,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            right: "15%",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.04)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 20,
              padding: "6px 14px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
              Live tracking available
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: "clamp(36px,6vw,60px)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 16,
              color: "#f1f5f9",
            }}
          >
            Track Your
            <br />
            <span style={{ color: "#e8001d" }}>Shipment</span>
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: 17,
              marginBottom: 36,
              lineHeight: 1.6,
            }}
          >
            Enter your tracking number to get real-time updates on your
            delivery.
          </p>

          {/* Track form */}
          <form
            onSubmit={handleTrack}
            style={{
              display: "flex",
              gap: 10,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            <input
              className="input"
              placeholder="e.g. DLV1234567890"
              value={tracking}
              onChange={(e) => {
                setTracking(e.target.value);
                setError("");
              }}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: "auto", padding: "13px 24px", flexShrink: 0 }}
            >
              {loading ? (
                <div
                  className="spin"
                  style={{ borderTopColor: "#fff", width: 16, height: 16 }}
                />
              ) : (
                "Track →"
              )}
            </button>
          </form>
          {error && (
            <p style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="container" style={{ padding: "60px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {[
            {
              icon: "📦",
              title: "Real-time Tracking",
              desc: "Live status updates for every shipment",
            },
            {
              icon: "🚛",
              title: "Multiple Carriers",
              desc: "Delhivery, DTDC, DHL and more",
            },
            {
              icon: "🧾",
              title: "Digital Invoices",
              desc: "View and download your invoices",
            },
            {
              icon: "📱",
              title: "Mobile Friendly",
              desc: "Works on any device, any browser",
            },
          ].map((f) => (
            <div key={f.title} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div
                style={{ fontWeight: 700, marginBottom: 6, color: "#f1f5f9" }}
              >
                {f.title}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!customer && (
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 16,
              padding: "36px 32px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 26,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              Have an account?
            </h2>
            <p style={{ color: "#64748b", marginBottom: 24, fontSize: 15 }}>
              Sign in to view all your orders and invoices in one place.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/login"
                className="btn btn-primary"
                style={{ textDecoration: "none", width: "auto" }}
              >
                Sign In
              </Link>
              <button
                className="btn btn-ghost"
                style={{ width: "auto" }}
                onClick={() => {
                  loginAsGuest();
                  navigate("/track");
                }}
              >
                Continue as Guest →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
