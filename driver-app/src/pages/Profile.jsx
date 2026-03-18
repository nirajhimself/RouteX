import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { driver, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "24px 20px 16px" }}>
        <p
          style={{
            color: "#e8001d",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Account
        </p>
        <h1
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 32,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: -0.5,
          }}
        >
          Profile
        </h1>
      </div>

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Avatar + name */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#e8001d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {driver?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 26,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {driver?.name}
            </div>
            <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
              Driver ID #{driver?.id}
            </div>
            <div style={{ marginTop: 6 }}>
              <span
                style={{
                  background: driver?.is_available ? "#052e16" : "#1f0a0a",
                  color: driver?.is_available ? "#22c55e" : "#f87171",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {driver?.is_available ? "● Available" : "● On Trip"}
              </span>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {[
            { label: "Phone", value: driver?.phone || "Not set", icon: "📱" },
            {
              label: "Company ID",
              value: `#${driver?.company_id}`,
              icon: "🏢",
            },
            { label: "App", value: "RouteX Driver v1.0", icon: "📦" },
          ].map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                borderBottom: i < 2 ? "1px solid #1e293b" : "none",
              }}
            >
              <span style={{ fontSize: 20 }}>{row.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#555",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {row.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                  {row.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          className="btn btn-ghost"
          style={{
            borderColor: "#7f1d1d",
            color: "#f87171",
            marginTop: 8,
            height: 52,
          }}
          onClick={handleLogout}
        >
          Sign Out
        </button>

        <p style={{ textAlign: "center", color: "#333", fontSize: 12 }}>
          RouteX AI Logistics Platform
        </p>
      </div>
    </div>
  );
}
