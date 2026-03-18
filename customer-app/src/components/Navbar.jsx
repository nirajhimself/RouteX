import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo">
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#f1f5f9",
          }}
        >
          Route
        </span>
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#e8001d",
          }}
        >
          X
        </span>
      </NavLink>
      <div className="nav-links">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          end
        >
          Home
        </NavLink>
        <NavLink
          to="/track"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Track
        </NavLink>
        <NavLink
          to="/book"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          📦 Book
        </NavLink>
        {customer && customer.type !== "guest" && (
          <NavLink
            to="/orders"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            My Orders
          </NavLink>
        )}
        <NavLink
          to="/invoices"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Invoices
        </NavLink>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {customer ? (
          <>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {customer.name || "Guest"}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <NavLink
            to="/login"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: "none" }}
          >
            Sign In
          </NavLink>
        )}
      </div>
    </nav>
  );
}
