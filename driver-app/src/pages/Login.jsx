import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your name");
    setError("");
    setLoading(true);
    try {
      await login(name.trim(), phone.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', 'Barlow', sans-serif",
              fontSize: 32,
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: -1,
            }}
          >
            Route
          </span>
          <span
            style={{
              fontFamily: "'Syne', 'Barlow', sans-serif",
              fontSize: 32,
              fontWeight: 800,
              color: "#e8001d",
              letterSpacing: -1,
            }}
          >
            X
          </span>
        </div>
        <p
          style={{
            color: "#475569",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.12em",
            fontFamily: "monospace",
          }}
        >
          // Driver Portal
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 16,
          padding: "32px 28px",
          width: "100%",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 6,
          }}
        >
          Driver Login
        </h2>
        <p
          style={{
            color: "#475569",
            fontSize: 14,
            marginBottom: 24,
            fontFamily: "monospace",
          }}
        >
          Sign in to see your deliveries
        </p>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
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
                marginBottom: 8,
              }}
            >
              Your Name
            </label>
            <input
              className="input"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
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
                marginBottom: 8,
              }}
            >
              Phone Number
            </label>
            <input
              className="input"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              autoComplete="tel"
            />
          </div>

          {error && (
            <div
              style={{
                background: "#1f0a0a",
                border: "1px solid #7f1d1d",
                borderRadius: 10,
                padding: "12px 16px",
                color: "#f87171",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              height: 50,
              fontSize: 15,
              letterSpacing: "0.03em",
              borderRadius: 10,
            }}
          >
            {loading ? (
              <>
                <div
                  className="spin"
                  style={{ borderTopColor: "#fff", width: 16, height: 16 }}
                />{" "}
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      <p
        style={{
          color: "#334155",
          fontSize: 12,
          textAlign: "center",
          marginTop: 24,
          lineHeight: 1.6,
        }}
      >
        Your account is created by your company admin.
        <br />
        Contact them if you can't sign in.
      </p>
    </div>
  );
}
