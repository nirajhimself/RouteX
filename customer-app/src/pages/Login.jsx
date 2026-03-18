import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim())
      return setError("Enter your email or phone");
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), phone.trim());
      navigate("/orders");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: "#f1f5f9",
              }}
            >
              Route
            </span>
            <span
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: "#e8001d",
              }}
            >
              X
            </span>
          </Link>
          <p
            style={{
              color: "#475569",
              fontSize: 13,
              marginTop: 6,
              fontFamily: "monospace",
            }}
          >
            Customer Portal
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            Sign In
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
            Access your orders and invoices
          </p>

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                Phone (optional)
              </label>
              <input
                className="input"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#1f0a0a",
                  border: "1px solid #7f1d1d",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#f87171",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={loading}
              style={{ height: 48, marginTop: 4 }}
            >
              {loading ? (
                <>
                  <div
                    className="spin"
                    style={{ borderTopColor: "#fff", width: 16, height: 16 }}
                  />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="divider" />

          <button
            className="btn btn-ghost btn-full"
            style={{ height: 44 }}
            onClick={() => {
              loginAsGuest();
              navigate("/track");
            }}
          >
            Continue as Guest — just track a shipment
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "#334155",
            fontSize: 12,
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          Your account is linked to your email registered
          <br />
          with your logistics provider.
        </p>
      </div>
    </div>
  );
}
