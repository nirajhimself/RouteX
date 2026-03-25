import { useState, useEffect } from "react";
import API from "../config";

const STATUS_STYLE = {
  draft: { bg: "#1e293b", color: "#94a3b8", label: "Draft" },
  sent: { bg: "#0c2340", color: "#60a5fa", label: "Sent" },
  paid: { bg: "#052e16", color: "#4ade80", label: "Paid" },
  overdue: { bg: "#2d0a0a", color: "#f87171", label: "Overdue" },
  cancelled: { bg: "#1c1917", color: "#a8a29e", label: "Cancelled" },
};

function fmt(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/invoices`);
      const data = await r.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: invoices.length,
    paid: invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.total, 0),
    pending: invoices.filter((i) => ["sent", "draft"].includes(i.status))
      .length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  return (
    <div className="container page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 32,
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            Invoices
          </h1>
          <p style={{ color: "#64748b" }}>Your billing history</p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Total", value: stats.total, color: "#60a5fa" },
          { label: "Paid", value: fmt(stats.paid), color: "#4ade80" },
          { label: "Pending", value: stats.pending, color: "#fbbf24" },
          { label: "Overdue", value: stats.overdue, color: "#f87171" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <input
          className="input"
          placeholder="Search by client or invoice #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {["all", "draft", "sent", "paid", "overdue"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: filter === s ? "#1e293b" : "none",
                color: filter === s ? "#f1f5f9" : "#64748b",
                border: "none",
                borderRadius: 7,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: filter === s ? 600 : 400,
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="spinner">
          <div className="spin" />
          Loading invoices…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 48 }}>🧾</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>No invoices found</div>
        </div>
      ) : (
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Invoice #",
                  "Client",
                  "Issue Date",
                  "Due Date",
                  "Amount",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderBottom: "1px solid #1e293b",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const st = STATUS_STYLE[inv.status] || STATUS_STYLE.draft;
                return (
                  <tr
                    key={inv.id}
                    style={{
                      borderBottom: "1px solid #0f172a",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#1e293b")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => setSelected(inv)}
                  >
                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#60a5fa",
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {inv.invoice_number}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {inv.client_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {inv.client_email}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: 14,
                        color: "#94a3b8",
                      }}
                    >
                      {inv.issue_date}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: 14,
                        color: inv.status === "overdue" ? "#f87171" : "#94a3b8",
                      }}
                    >
                      {inv.due_date}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {fmt(inv.total)}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          background: st.bg,
                          color: st.color,
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(inv);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice detail modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 16,
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#60a5fa",
                  }}
                >
                  {selected.invoice_number}
                </div>
                <span
                  style={{
                    background: STATUS_STYLE[selected.status]?.bg,
                    color: STATUS_STYLE[selected.status]?.color,
                    padding: "2px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {STATUS_STYLE[selected.status]?.label}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px 24px", overflowY: "auto" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Client
                  </div>
                  <div style={{ fontWeight: 600 }}>{selected.client_name}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {selected.client_email}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Dates
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Issued: {selected.issue_date}
                  </div>
                  <div style={{ fontSize: 13 }}>Due: {selected.due_date}</div>
                </div>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: 16,
                }}
              >
                <thead>
                  <tr>
                    {["Description", "Qty", "Unit Price", "Total"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          borderBottom: "1px solid #1e293b",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(selected.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0f172a" }}>
                      <td style={{ padding: "11px 12px", fontSize: 14 }}>
                        {item.description}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          fontSize: 14,
                          color: "#94a3b8",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          fontSize: 14,
                          color: "#94a3b8",
                        }}
                      >
                        {fmt(item.unit_price)}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {fmt(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    width: 220,
                    background: "#020617",
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#64748b",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span>Subtotal</span>
                    <span>{fmt(selected.subtotal)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#64748b",
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    <span>Tax ({selected.tax_rate}%)</span>
                    <span>{fmt(selected.tax)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#4ade80",
                      fontWeight: 700,
                      fontSize: 16,
                      borderTop: "1px solid #1e293b",
                      paddingTop: 8,
                    }}
                  >
                    <span>Total</span>
                    <span>{fmt(selected.total)}</span>
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div
                  style={{
                    marginTop: 16,
                    background: "#020617",
                    borderRadius: 8,
                    padding: 12,
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  {selected.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
