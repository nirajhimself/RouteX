import { useState, useEffect } from "react";

const API = "http://localhost:8000";

const STATUS_STYLES = {
  draft: { bg: "#1e293b", color: "#94a3b8", label: "Draft" },
  sent: { bg: "#0c2340", color: "#38bdf8", label: "Sent" },
  paid: { bg: "#052e16", color: "#4ade80", label: "Paid" },
  overdue: { bg: "#2d0a0a", color: "#f87171", label: "Overdue" },
  cancelled: { bg: "#1c1917", color: "#a8a29e", label: "Cancelled" },
};

const initialForm = {
  client_name: "",
  client_email: "",
  client_address: "",
  invoice_number: "",
  issue_date: "",
  due_date: "",
  items: [{ description: "", quantity: 1, unit_price: 0 }],
  tax_rate: 0,
  notes: "",
  status: "draft",
};

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function calcTotals(items, tax_rate) {
  const subtotal = items.reduce(
    (s, i) => s + (i.quantity * i.unit_price || 0),
    0,
  );
  const tax = subtotal * ((tax_rate || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function fetchInvoices() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/invoices`);
      const data = await r.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }

  const openCreate = () => {
    setEditId(null);
    const num = `INV-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split("T")[0];
    const due = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split("T")[0];
    setForm({
      ...initialForm,
      invoice_number: num,
      issue_date: today,
      due_date: due,
    });
    setShowModal(true);
  };

  const openEdit = (inv) => {
    setEditId(inv.id);
    setForm({
      client_name: inv.client_name,
      client_email: inv.client_email,
      client_address: inv.client_address || "",
      invoice_number: inv.invoice_number,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      items: inv.items || [{ description: "", quantity: 1, unit_price: 0 }],
      tax_rate: inv.tax_rate || 0,
      notes: inv.notes || "",
      status: inv.status,
    });
    setShowModal(true);
  };

  async function handleSubmit() {
    if (!form.client_name || !form.invoice_number)
      return showToast("Client name and invoice number required", "error");
    const totals = calcTotals(form.items, form.tax_rate);
    const payload = { ...form, ...totals };
    try {
      if (editId) {
        const r = await fetch(`${API}/invoices/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error();
        showToast("Invoice updated");
      } else {
        const r = await fetch(`${API}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error();
        showToast("Invoice created");
      }
      setShowModal(false);
      fetchInvoices();
    } catch {
      showToast("Save failed", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`${API}/invoices/${id}`, { method: "DELETE" });
      showToast("Invoice deleted");
      setDeleteConfirm(null);
      if (viewInvoice?.id === id) setViewInvoice(null);
      fetchInvoices();
    } catch {
      showToast("Delete failed", "error");
    }
  }

  async function updateStatus(id, status) {
    try {
      await fetch(`${API}/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchInvoices();
      if (viewInvoice?.id === id)
        setViewInvoice((prev) => ({ ...prev, status }));
    } catch {
      showToast("Status update failed", "error");
    }
  }

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: invoices.length,
    paid: invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + (i.total || 0), 0),
    outstanding: invoices
      .filter((i) => ["sent", "overdue"].includes(i.status))
      .reduce((s, i) => s + (i.total || 0), 0),
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  const setItem = (idx, field, val) => {
    const items = form.items.map((it, i) =>
      i === idx
        ? {
            ...it,
            [field]: field === "description" ? val : parseFloat(val) || 0,
          }
        : it,
    );
    setForm((f) => ({ ...f, items }));
  };
  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { description: "", quantity: 1, unit_price: 0 }],
    }));
  const removeItem = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const { subtotal, tax, total } = calcTotals(form.items, form.tax_rate);

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            ...s.toast,
            background: toast.type === "error" ? "#7f1d1d" : "#14532d",
          }}
        >
          {toast.type === "error" ? "✕ " : "✓ "}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Invoice & Billing</h1>
          <p style={s.subtitle}>
            Manage client invoices, payments & billing records
          </p>
        </div>
        <button style={s.btnPrimary} onClick={openCreate}>
          + New Invoice
        </button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          {
            label: "Total Invoices",
            value: stats.total,
            icon: "🧾",
            color: "#60a5fa",
          },
          {
            label: "Total Collected",
            value: formatCurrency(stats.paid),
            icon: "✅",
            color: "#4ade80",
          },
          {
            label: "Outstanding",
            value: formatCurrency(stats.outstanding),
            icon: "⏳",
            color: "#fbbf24",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            icon: "🚨",
            color: "#f87171",
          },
        ].map((st) => (
          <div key={st.label} style={s.statCard}>
            <span style={{ fontSize: 24 }}>{st.icon}</span>
            <div>
              <div style={{ ...s.statValue, color: st.color }}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <input
          placeholder="Search by client or invoice #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.searchInput}
        />
        <div style={s.tabs}>
          {["all", "draft", "sent", "paid", "overdue", "cancelled"].map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  ...s.tab,
                  ...(filterStatus === st ? s.tabActive : {}),
                }}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.empty}>Loading invoices…</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            No invoices found. Create your first invoice!
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {[
                  "Invoice #",
                  "Client",
                  "Issue Date",
                  "Due Date",
                  "Amount",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} style={s.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const st = STATUS_STYLES[inv.status] || STATUS_STYLES.draft;
                return (
                  <tr
                    key={inv.id}
                    style={s.tr}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#1e293b")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        ...s.td,
                        color: "#e8001d",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      onClick={() => setViewInvoice(inv)}
                    >
                      {inv.invoice_number}
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600 }}>{inv.client_name}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {inv.client_email}
                      </div>
                    </td>
                    <td style={s.td}>{inv.issue_date}</td>
                    <td
                      style={{
                        ...s.td,
                        color: inv.status === "overdue" ? "#f87171" : "inherit",
                      }}
                    >
                      {inv.due_date}
                    </td>
                    <td style={{ ...s.td, fontWeight: 700 }}>
                      {formatCurrency(inv.total)}
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          background: st.bg,
                          color: st.color,
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          style={s.btnSm}
                          onClick={() => setViewInvoice(inv)}
                        >
                          View
                        </button>
                        <button style={s.btnSm} onClick={() => openEdit(inv)}>
                          Edit
                        </button>
                        <button
                          style={{
                            ...s.btnSm,
                            color: "#f87171",
                            borderColor: "#7f1d1d",
                          }}
                          onClick={() => setDeleteConfirm(inv.id)}
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                {editId ? "Edit Invoice" : "Create Invoice"}
              </h2>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Invoice Number *</label>
                  <input
                    style={s.input}
                    value={form.invoice_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, invoice_number: e.target.value }))
                    }
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Status</label>
                  <select
                    style={s.input}
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    {Object.keys(STATUS_STYLES).map((st) => (
                      <option key={st} value={st}>
                        {STATUS_STYLES[st].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Client Name *</label>
                  <input
                    style={s.input}
                    value={form.client_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, client_name: e.target.value }))
                    }
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Client Email</label>
                  <input
                    style={s.input}
                    value={form.client_email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, client_email: e.target.value }))
                    }
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Issue Date</label>
                  <input
                    type="date"
                    style={s.input}
                    value={form.issue_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, issue_date: e.target.value }))
                    }
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Due Date</label>
                  <input
                    type="date"
                    style={s.input}
                    value={form.due_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, due_date: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Client Address</label>
                <input
                  style={s.input}
                  value={form.client_address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, client_address: e.target.value }))
                  }
                />
              </div>

              {/* Line Items */}
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <label style={{ ...s.label, margin: 0 }}>Line Items</label>
                  <button style={s.btnSm} onClick={addItem}>
                    + Add Item
                  </button>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #1e293b",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#1e293b" }}>
                        {[
                          "Description",
                          "Qty",
                          "Unit Price (₹)",
                          "Total",
                          "",
                        ].map((h) => (
                          <th key={h} style={{ ...s.th, padding: "8px 12px" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #1e293b" }}
                        >
                          <td style={{ padding: "6px 8px" }}>
                            <input
                              style={{ ...s.input, margin: 0 }}
                              value={item.description}
                              onChange={(e) =>
                                setItem(idx, "description", e.target.value)
                              }
                              placeholder="Description"
                            />
                          </td>
                          <td style={{ padding: "6px 8px", width: 70 }}>
                            <input
                              type="number"
                              style={{ ...s.input, margin: 0 }}
                              value={item.quantity}
                              onChange={(e) =>
                                setItem(idx, "quantity", e.target.value)
                              }
                            />
                          </td>
                          <td style={{ padding: "6px 8px", width: 130 }}>
                            <input
                              type="number"
                              style={{ ...s.input, margin: 0 }}
                              value={item.unit_price}
                              onChange={(e) =>
                                setItem(idx, "unit_price", e.target.value)
                              }
                            />
                          </td>
                          <td
                            style={{
                              padding: "6px 12px",
                              color: "#94a3b8",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatCurrency(item.quantity * item.unit_price)}
                          </td>
                          <td
                            style={{ padding: "6px 8px", textAlign: "center" }}
                          >
                            {form.items.length > 1 && (
                              <button
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#f87171",
                                  cursor: "pointer",
                                  fontSize: 16,
                                }}
                                onClick={() => removeItem(idx)}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    width: 280,
                    background: "#0f172a",
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div style={s.totalRow}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      margin: "8px 0",
                    }}
                  >
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Tax (%)
                    </span>
                    <input
                      type="number"
                      style={{
                        ...s.input,
                        width: 70,
                        margin: 0,
                        padding: "4px 8px",
                      }}
                      value={form.tax_rate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          tax_rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    <span style={{ marginLeft: "auto" }}>
                      {formatCurrency(tax)}
                    </span>
                  </div>
                  <div
                    style={{
                      ...s.totalRow,
                      color: "#4ade80",
                      fontWeight: 700,
                      fontSize: 16,
                      borderTop: "1px solid #1e293b",
                      paddingTop: 8,
                    }}
                  >
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Notes</label>
                <textarea
                  style={{ ...s.input, height: 70, resize: "vertical" }}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Payment terms, additional notes..."
                />
              </div>
            </div>
            <div style={s.modalFooter}>
              <button
                style={s.btnSecondary}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button style={s.btnPrimary} onClick={handleSubmit}>
                {editId ? "Save Changes" : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewInvoice && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 680 }}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>
                  {viewInvoice.invoice_number}
                </h2>
                <span
                  style={{
                    background: STATUS_STYLES[viewInvoice.status]?.bg,
                    color: STATUS_STYLES[viewInvoice.status]?.color,
                    padding: "2px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {STATUS_STYLES[viewInvoice.status]?.label}
                </span>
              </div>
              <button style={s.closeBtn} onClick={() => setViewInvoice(null)}>
                ✕
              </button>
            </div>
            <div style={s.modalBody}>
              <div style={s.grid2}>
                <div>
                  <div style={s.label}>Client</div>
                  <div style={{ fontWeight: 600 }}>
                    {viewInvoice.client_name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    {viewInvoice.client_email}
                  </div>
                </div>
                <div>
                  <div style={s.label}>Dates</div>
                  <div style={{ fontSize: 13 }}>
                    Issued: {viewInvoice.issue_date}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Due: {viewInvoice.due_date}
                  </div>
                </div>
              </div>
              {viewInvoice.client_address && (
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
                  {viewInvoice.client_address}
                </div>
              )}
              <table style={{ ...s.table, marginTop: 20 }}>
                <thead>
                  <tr>
                    {["Description", "Qty", "Unit Price", "Total"].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(viewInvoice.items || []).map((item, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>{item.description}</td>
                      <td style={s.td}>{item.quantity}</td>
                      <td style={s.td}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    width: 240,
                    background: "#0f172a",
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div style={s.totalRow}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(viewInvoice.subtotal)}</span>
                  </div>
                  <div style={s.totalRow}>
                    <span>Tax ({viewInvoice.tax_rate}%)</span>
                    <span>{formatCurrency(viewInvoice.tax)}</span>
                  </div>
                  <div
                    style={{
                      ...s.totalRow,
                      color: "#4ade80",
                      fontWeight: 700,
                      fontSize: 16,
                      borderTop: "1px solid #1e293b",
                      paddingTop: 8,
                    }}
                  >
                    <span>Total</span>
                    <span>{formatCurrency(viewInvoice.total)}</span>
                  </div>
                </div>
              </div>
              {viewInvoice.notes && (
                <div
                  style={{
                    marginTop: 16,
                    background: "#0f172a",
                    borderRadius: 8,
                    padding: 12,
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  {viewInvoice.notes}
                </div>
              )}
              <div style={{ marginTop: 20 }}>
                <div style={s.label}>Update Status</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.keys(STATUS_STYLES)
                    .filter((st) => st !== viewInvoice.status)
                    .map((st) => (
                      <button
                        key={st}
                        style={{
                          ...s.btnSm,
                          background: STATUS_STYLES[st].bg,
                          color: STATUS_STYLES[st].color,
                          borderColor: STATUS_STYLES[st].color + "44",
                        }}
                        onClick={() => updateStatus(viewInvoice.id, st)}
                      >
                        Mark {STATUS_STYLES[st].label}
                      </button>
                    ))}
                </div>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button
                style={{
                  ...s.btnSecondary,
                  color: "#f87171",
                  borderColor: "#7f1d1d",
                }}
                onClick={() => {
                  setDeleteConfirm(viewInvoice.id);
                  setViewInvoice(null);
                }}
              >
                Delete
              </button>
              <button
                style={s.btnSm}
                onClick={() => {
                  openEdit(viewInvoice);
                  setViewInvoice(null);
                }}
              >
                Edit Invoice
              </button>
              <button
                style={s.btnSecondary}
                onClick={() => setViewInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={s.overlay}>
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #7f1d1d",
              borderRadius: 12,
              padding: 28,
              maxWidth: 380,
              width: "90%",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ color: "#f87171", margin: "0 0 8px" }}>
              Delete Invoice?
            </h3>
            <p style={{ color: "#94a3b8", margin: "0 0 20px", fontSize: 14 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                style={s.btnSecondary}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                style={{ ...s.btnPrimary, background: "#7f1d1d" }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
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
    marginBottom: 28,
  },
  title: {
    margin: "0 0 4px",
    fontSize: 26,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
  },
  subtitle: { margin: 0, color: "#64748b", fontSize: 14 },
  btnPrimary: {
    background: "#e8001d",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  btnSecondary: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 13,
  },
  btnSm: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: "5px 12px",
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  statValue: { fontSize: 22, fontWeight: 700, lineHeight: 1 },
  statLabel: { color: "#64748b", fontSize: 12, marginTop: 4 },
  filterRow: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  searchInput: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "9px 14px",
    color: "#e2e8f0",
    fontSize: 14,
    width: 280,
    outline: "none",
  },
  tabs: {
    display: "flex",
    gap: 4,
    background: "#0f172a",
    padding: 4,
    borderRadius: 10,
    border: "1px solid #1e293b",
  },
  tab: {
    background: "none",
    border: "none",
    color: "#64748b",
    padding: "6px 14px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.15s",
  },
  tabActive: { background: "#e8001d", color: "#fff", fontWeight: 600 },
  tableWrap: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 14,
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: "1px solid #1e293b",
  },
  tr: { transition: "background 0.15s" },
  td: { padding: "13px 16px", fontSize: 14, borderBottom: "1px solid #0f172a" },
  empty: { padding: 48, textAlign: "center", color: "#475569" },
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
    maxWidth: 760,
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #1e293b",
  },
  modalBody: { padding: "20px 24px", overflowY: "auto", flex: 1 },
  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #1e293b",
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: 18,
    padding: 4,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 4,
  },
  field: { marginBottom: 14 },
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
    padding: "9px 12px",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 6,
  },
  toast: {
    position: "fixed",
    bottom: 24,
    right: 24,
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    zIndex: 2000,
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
};
