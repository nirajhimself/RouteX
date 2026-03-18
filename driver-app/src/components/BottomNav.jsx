import { NavLink } from "react-router-dom";

const NAV = [
  { path: "/", label: "Trips", icon: "🚛" },
  { path: "/earnings", label: "Earnings", icon: "💰" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav
      style={{
        display: "flex",
        background: "#0f172a",
        borderTop: "1px solid #1e293b",
        padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
        position: "sticky",
        bottom: 0,
        zIndex: 100,
      }}
    >
      {NAV.map(({ path, label, icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === "/"}
          style={{ flex: 1, textDecoration: "none" }}
        >
          {({ isActive }) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "6px 0",
                color: isActive ? "#e8001d" : "#555",
                transition: "color 0.15s",
              }}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </span>
              {isActive && (
                <div
                  style={{
                    width: 20,
                    height: 2,
                    background: "#e8001d",
                    borderRadius: 2,
                  }}
                />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
