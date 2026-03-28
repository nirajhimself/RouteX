import { useState } from "react";
import API from "../config"; // ✅ use correct backend

export default function Login() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!name.trim()) return setError("Enter your name");
    if (!phone.trim()) return setError("Enter phone number");

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/driver/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // ✅ store driver
      localStorage.setItem("driver", JSON.stringify(data));

      // ✅ redirect
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to login");
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
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9" }}>
            Route
          </span>
          <span style={{ fontSize: 32, fontWeight: 800, color: "#e8001d" }}>
            X
          </span>
        </div>
        <p style={{ color: "#475569", fontSize: 13 }}>// Driver Portal</p>
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
        <h2 style={{ color: "#f1f5f9" }}>Driver Login</h2>
        <p style={{ color: "#475569", marginBottom: 20 }}>
          Sign in to see your deliveries
        </p>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <input
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {error && (
            <div
              style={{
                background: "#1f0a0a",
                border: "1px solid #7f1d1d",
                padding: "10px",
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#e8001d",
              color: "#fff",
              height: 50,
              borderRadius: 10,
              border: "none",
              fontWeight: "bold",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
