import { useState, useEffect } from "react";
import api from "../api/api"; // ✅ centralized axios

const STATUS_STYLES = {
  draft: { bg: "#1e293b", color: "#94a3b8", label: "Draft" },
  sent: { bg: "#0c2340", color: "#38bdf8", label: "Sent" },
  paid: { bg: "#052e16", color: "#4ade80", label: "Paid" },
  overdue: { bg: "#2d0a0a", color: "#f87171", label: "Overdue" },
  cancelled: { bg: "#1c1917", color: "#a8a29e", label: "Cancelled" },
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ✅ FIXED: using axios
  async function fetchInvoices() {
    setLoading(true);
    try {
      const { data } = await api.get("/invoices");
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ FIXED: create/update
  async function handleSubmit(payload, editId) {
    try {
      if (editId) {
        await api.put(`/invoices/${editId}`, payload);
      } else {
        await api.post("/invoices", payload);
      }
      fetchInvoices();
    } catch (err) {
      console.error("Save failed", err);
    }
  }

  // ✅ FIXED: delete
  async function handleDelete(id) {
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  // ✅ FIXED: status update
  async function updateStatus(id, status) {
    try {
      await api.patch(`/invoices/${id}/status`, { status });
      fetchInvoices();
    } catch (err) {
      console.error("Status update failed", err);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Invoices</h2>

      {loading ? (
        <p>Loading...</p>
      ) : invoices.length === 0 ? (
        <p>No invoices found</p>
      ) : (
        <ul>
          {invoices.map((inv) => (
            <li key={inv.id}>
              {inv.invoice_number} - ₹{inv.total}
              <button onClick={() => handleDelete(inv.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
