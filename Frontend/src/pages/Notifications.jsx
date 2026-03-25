import { useState, useEffect, useCallback } from "react";
import api from "../api/api"; // ✅ central axios

const CID = 1;

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

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ FIXED: axios
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications/${CID}`);
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unread_count || 0);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // auto refresh
  useEffect(() => {
    const t = setInterval(fetchNotifications, 30000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  // ✅ FIXED: mark all read
  async function markAllRead() {
    try {
      await api.patch(`/notifications/read-all/${CID}`);
      setNotifications((n) => n.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
      showToast("All marked as read");
    } catch (err) {
      console.error(err);
      showToast("Failed", "error");
    }
  }

  // ✅ FIXED
  async function markRead(id) {
    try {
      await api.patch(`/notifications/read`, { ids: [id] });
      setNotifications((n) =>
        n.map((x) => (x.id === id ? { ...x, is_read: true } : x)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch (err) {
      console.error(err);
    }
  }

  // ✅ FIXED
  async function deleteNotif(id) {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((n) => n.filter((x) => x.id !== id));
      showToast("Deleted");
    } catch (err) {
      console.error(err);
      showToast("Failed", "error");
    }
  }

  // ✅ FIXED
  async function clearAll() {
    try {
      await api.delete(`/notifications/clear/${CID}`);
      setNotifications([]);
      setUnread(0);
      showToast("All cleared");
    } catch (err) {
      console.error(err);
      showToast("Failed", "error");
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "all") return true;
    return n.category === filter;
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>Notifications {unread > 0 && <span>({unread})</span>}</h1>

      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("unread")}>Unread</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p>No notifications</p>
      ) : (
        filtered.map((n) => {
          const st = TYPE_STYLES[n.type] || TYPE_STYLES.info;
          return (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                border: `1px solid ${st.border}`,
                padding: 10,
                marginBottom: 10,
                background: n.is_read ? "#111" : st.bg,
                cursor: "pointer",
              }}
            >
              <strong>{n.title}</strong>
              <p>{n.message}</p>

              <button onClick={() => deleteNotif(n.id)}>Delete</button>
            </div>
          );
        })
      )}

      <button onClick={markAllRead}>Mark all read</button>
      <button onClick={clearAll}>Clear all</button>

      {toast && <div>{toast.msg}</div>}
    </div>
  );
}
