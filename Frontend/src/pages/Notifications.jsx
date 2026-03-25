import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const CID = 1; // company id

const TYPE_STYLES = {
  info: { bg: "#0c1a2e", color: "#60a5fa", border: "#1e3a5f", icon: "ℹ️" },
  success: { bg: "#052e16", color: "#4ade80", border: "#166534", icon: "✅" },
  warning: { bg: "#1c1500", color: "#fbbf24", border: "#854d0e", icon: "⚠️" },
  error: { bg: "#1f0a0a", color: "#f87171", border: "#7f1d1d", icon: "🚨" },
};

const CAT_ICONS = {
  system: "⚙️",
  shipment: "🚛",
  booking: "📦",
  driver: "👤",
  invoice: "🧾",
};

const DEMO_NOTIFICATIONS = [
  {
    title: "New shipment assigned",
    message: "Shipment #SHP-001 has been assigned to you",
    type: "info",
    category: "shipment",
  },
  {
    title: "Booking delivered",
    message: "Booking DLV123 has been delivered successfully",
    type: "success",
    category: "booking",
  },
  {
    title: "Driver offline",
    message: "Driver Rajesh Kumar has gone offline",
    type: "warning",
    category: "driver",
  },
  {
    title: "Invoice overdue",
    message: "Invoice INV-2024-001 is overdue by 5 days",
    type: "error",
    category: "invoice",
  },
  {
    title: "Route optimized",
    message: "Route RT-38 saved 34 km with new optimization",
    type: "success",
    category: "system",
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    category: "system",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/notifications/${CID}`);
      const data = await r.json();
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(fetchNotifications, 30000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  async function markAllRead() {
    try {
      await fetch(`${API}/notifications/read-all/${CID}`, { method: "PATCH" });
      setNotifications((n) => n.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
      showToast("All marked as read");
    } catch {
      showToast("Failed", "error");
    }
  }

  async function markRead(id) {
    try {
      await fetch(`${API}/notifications/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((n) =>
        n.map((x) => (x.id === id ? { ...x, is_read: true } : x)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  }

  async function deleteNotif(id) {
    try {
      await fetch(`${API}/notifications/${id}`, { method: "DELETE" });
      setNotifications((n) => n.filter((x) => x.id !== id));
      showToast("Deleted");
    } catch {
      showToast("Failed", "error");
    }
  }

  async function clearAll() {
    try {
      await fetch(`${API}/notifications/clear/${CID}`, { method: "DELETE" });
      setNotifications([]);
      setUnread(0);
      showToast("All cleared");
    } catch {
      showToast("Failed", "error");
    }
  }

  async function createNotification() {
    if (!form.title || !form.message)
      return showToast("Fill title and message", "error");
    try {
      await fetch(`${API}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: CID, ...form }),
      });
      setShowCreate(false);
      setForm({ title: "", message: "", type: "info", category: "system" });
      fetchNotifications();
      showToast("Notification created");
    } catch {
      showToast("Failed", "error");
    }
  }

  async function seedDemo() {
    for (const n of DEMO_NOTIFICATIONS) {
      await fetch(`${API}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: CID, ...n }),
      }).catch(() => {});
    }
    fetchNotifications();
    showToast("Demo notifications added ✓");
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "all") return true;
    return n.category === filter;
  });

  const categories = [
    "all",
    "unread",
    "system",
    "shipment",
    "booking",
    "driver",
    "invoice",
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>
            Notifications
            {unread > 0 && <span style={s.badge}>{unread}</span>}
          </h1>
          <p style={s.sub}>Real-time alerts and system updates</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {notifications.length === 0 && (
            <button
              onClick={seedDemo}
              style={{
                ...s.btnGhost,
                color: "#a78bfa",
                borderColor: "#4c1d95",
              }}
            >
              + Add Demo
            </button>
          )}
          <button onClick={() => setShowCreate(true)} style={s.btnPrimary}>
            + New
          </button>
          {unread > 0 && (
            <button onClick={markAllRead} style={s.btnGhost}>
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                ...s.btnGhost,
                color: "#f87171",
                borderColor: "#7f1d1d",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div
        style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              ...s.filterBtn,
              ...(filter === cat ? s.filterActive : {}),
            }}
          >
            {CAT_ICONS[cat] || ""} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            {cat === "unread" && unread > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "1px 6px",
                  fontSize: 10,
                  marginLeft: 4,
                }}
              >
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div style={s.loadWrap}>
          <div style={s.spin} />
          <span style={{ color: "#64748b" }}>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            {filter === "unread"
              ? "You're all caught up!"
              : "No notifications yet"}
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>
            {filter === "unread"
              ? "No unread notifications."
              : "Click '+ Add Demo' to seed sample notifications."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((n) => {
            const st = TYPE_STYLES[n.type] || TYPE_STYLES.info;
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  background: n.is_read ? "#0f172a" : st.bg,
                  border: `1px solid ${n.is_read ? "#1e293b" : st.border}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: n.is_read ? "default" : "pointer",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  transition: "all 0.15s",
                  opacity: n.is_read ? 0.7 : 1,
                }}
              >
                {/* Icon */}
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>
                  {st.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: n.is_read ? "#94a3b8" : "#f1f5f9",
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      {!n.is_read && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: st.color,
                          }}
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotif(n.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#475569",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    {n.message}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        background: "#1e293b",
                        color: "#64748b",
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 11,
                      }}
                    >
                      {CAT_ICONS[n.category]} {n.category}
                    </span>
                    <span
                      style={{
                        background: st.bg,
                        color: st.color,
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {n.type}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#334155",
                        marginLeft: "auto",
                      }}
                    >
                      {new Date(n.created_at).toLocaleString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                New Notification
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <label style={s.label}>Title</label>
                <input
                  style={s.input}
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label style={s.label}>Message</label>
                <textarea
                  style={{ ...s.input, height: 80, resize: "vertical" }}
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="Notification message"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label style={s.label}>Type</label>
                  <select
                    style={s.input}
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    {["info", "success", "warning", "error"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Category</label>
                  <select
                    style={s.input}
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                  >
                    {["system", "shipment", "booking", "driver", "invoice"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 4,
                }}
              >
                <button style={s.btnGhost} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button style={s.btnPrimary} onClick={createNotification}>
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: toast.type === "error" ? "#7f1d1d" : "#14532d",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            zIndex: 2000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    padding: "28px 32px",
    background: "#020617",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    margin: "0 0 4px",
    fontSize: 26,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    background: "#ef4444",
    color: "#fff",
    borderRadius: 20,
    padding: "2px 10px",
    fontSize: 14,
    fontWeight: 700,
  },
  sub: { margin: 0, color: "#64748b", fontSize: 14 },
  btnPrimary: {
    background: "linear-gradient(135deg,#3b82f6,#2563eb)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  btnGhost: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "9px 18px",
    cursor: "pointer",
    fontSize: 13,
  },
  filterBtn: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    color: "#64748b",
    borderRadius: 20,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  filterActive: {
    background: "#1e293b",
    color: "#e2e8f0",
    fontWeight: 600,
    borderColor: "#334155",
  },
  loadWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: "40vh",
  },
  spin: {
    width: 20,
    height: 20,
    border: "2px solid #1e293b",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    color: "#475569",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    width: "100%",
    maxWidth: 480,
  },
  label: {
    display: "block",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
};
