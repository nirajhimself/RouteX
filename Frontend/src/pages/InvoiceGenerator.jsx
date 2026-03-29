import { useState, useRef, useCallback } from "react";

const TAX_RATE = 0.18;

const DEFAULT_FORM = {
  companyName: "RouteX Logistics Pvt. Ltd.",
  companyAddress: "123 Industrial Area, Phase 2, Gurugram, Haryana 122002",
  companyEmail: "billing@routex.in",
  companyPhone: "+91 98100 00000",
  companyGST: "06AABCU9603R1ZX",
  customerName: "",
  customerAddress: "",
  customerEmail: "",
  customerPhone: "",
  customerGST: "",
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  invoiceDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
  paymentTerms: "Net 15 Days",
  notes:
    "Thank you for your business. Payment is due within the period stated above.",
  shipmentId: "",
  origin: "",
  destination: "",
  weight: "",
  vehicleType: "",
  freightCharge: "",
  handlingCharge: "",
  fuelSurcharge: "",
};

export default function InvoiceGenerator() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [logo, setLogo] = useState(null);
  const [signature, setSignature] = useState(null);
  const [preview, setPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef();
  const logoRef = useRef();
  const sigRef = useRef();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const subtotal =
    (parseFloat(form.freightCharge) || 0) +
    (parseFloat(form.handlingCharge) || 0) +
    (parseFloat(form.fuelSurcharge) || 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const total = subtotal + cgst + sgst;

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(n);

  const handleLogo = (e) => {
    const f = e.target.files[0];
    if (f) {
      const r = new FileReader();
      r.onload = (ev) => setLogo(ev.target.result);
      r.readAsDataURL(f);
    }
  };

  const handleSig = (e) => {
    const f = e.target.files[0];
    if (f) {
      const r = new FileReader();
      r.onload = (ev) => setSignature(ev.target.result);
      r.readAsDataURL(f);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setPreview(true);
    setTimeout(async () => {
      try {
        const html2canvas = (await import("https://esm.sh/html2canvas@1.4.1"))
          .default;
        const jsPDF = (await import("https://esm.sh/jspdf@2.5.1")).jsPDF;
        const canvas = await html2canvas(invoiceRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, w, h);
        pdf.save(`${form.invoiceNumber}.pdf`);
      } catch (e) {
        window.print();
      }
      setDownloading(false);
    }, 300);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(
      `Invoice ${form.invoiceNumber} from ${form.companyName}`,
    );
    const body = encodeURIComponent(
      `Dear ${form.customerName},\n\nPlease find attached Invoice ${form.invoiceNumber} for ₹${total.toFixed(2)}.\n\nDue Date: ${form.dueDate}\nPayment Terms: ${form.paymentTerms}\n\nThank you for your business.\n\n${form.companyName}`,
    );
    window.open(`mailto:${form.customerEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        maxWidth: 900,
        margin: "0 auto",
        padding: "1.5rem 0",
      }}
    >
      {!preview ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                }}
              >
                Invoice Generator
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                }}
              >
                Fill in details, preview, then download or send
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPreview(true)}
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                Preview
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  background: "#e8001d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--border-radius-md)",
                  cursor: "pointer",
                }}
              >
                {downloading ? "Generating..." : "Download PDF"}
              </button>
              <button
                onClick={handleEmail}
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                Send Email
              </button>
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* Company Details */}
            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                }}
              >
                Company Details
              </p>
              <div style={{ marginBottom: 8 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Company Logo
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {logo && (
                    <img
                      src={logo}
                      alt="logo"
                      style={{
                        height: 40,
                        objectFit: "contain",
                        borderRadius: 4,
                      }}
                    />
                  )}
                  <button
                    onClick={() => logoRef.current.click()}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {logo ? "Change Logo" : "Upload Logo"}
                  </button>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogo}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
              {[
                ["companyName", "Company Name"],
                ["companyAddress", "Address"],
                ["companyEmail", "Email"],
                ["companyPhone", "Phone"],
                ["companyGST", "GSTIN"],
              ].map(([k, label]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </label>
                  <input
                    value={form[k]}
                    onChange={set(k)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontSize: 13,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Customer + Invoice Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  background: "var(--color-background-primary)",
                  border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: "var(--border-radius-lg)",
                  padding: "1.25rem",
                }}
              >
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Invoice Details
                </p>
                {[
                  ["invoiceNumber", "Invoice No."],
                  ["invoiceDate", "Invoice Date", "date"],
                  ["dueDate", "Due Date", "date"],
                  ["paymentTerms", "Payment Terms"],
                ].map(([k, label, type]) => (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {label}
                    </label>
                    <input
                      type={type || "text"}
                      value={form[k]}
                      onChange={set(k)}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        fontSize: 13,
                      }}
                    />
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "var(--color-background-primary)",
                  border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: "var(--border-radius-lg)",
                  padding: "1.25rem",
                }}
              >
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Bill To (Customer)
                </p>
                {[
                  ["customerName", "Name"],
                  ["customerAddress", "Address"],
                  ["customerEmail", "Email"],
                  ["customerPhone", "Phone"],
                  ["customerGST", "GSTIN (optional)"],
                ].map(([k, label]) => (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {label}
                    </label>
                    <input
                      value={form[k]}
                      onChange={set(k)}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        fontSize: 13,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Shipment Details */}
            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                }}
              >
                Shipment Details
              </p>
              {[
                ["shipmentId", "Shipment ID"],
                ["origin", "Origin"],
                ["destination", "Destination"],
                ["weight", "Weight (kg)"],
                ["vehicleType", "Vehicle Type"],
              ].map(([k, label]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </label>
                  <input
                    value={form[k]}
                    onChange={set(k)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontSize: 13,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Charges */}
            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                }}
              >
                Charges (₹)
              </p>
              {[
                ["freightCharge", "Freight Charge"],
                ["handlingCharge", "Handling Charge"],
                ["fuelSurcharge", "Fuel Surcharge"],
              ].map(([k, label]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type="number"
                    value={form[k]}
                    onChange={set(k)}
                    placeholder="0.00"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontSize: 13,
                    }}
                  />
                </div>
              ))}
              <div
                style={{
                  marginTop: 16,
                  padding: "12px",
                  background: "var(--color-background-secondary)",
                  borderRadius: "var(--border-radius-md)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    marginBottom: 4,
                  }}
                >
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    marginBottom: 4,
                  }}
                >
                  <span>CGST 9%</span>
                  <span>{fmt(cgst)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    marginBottom: 8,
                  }}
                >
                  <span>SGST 9%</span>
                  <span>{fmt(sgst)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    borderTop: "0.5px solid var(--color-border-tertiary)",
                    paddingTop: 8,
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "#e8001d" }}>{fmt(total)}</span>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  E-Signature (Authorised Signatory)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {signature && (
                    <img
                      src={signature}
                      alt="signature"
                      style={{ height: 50, objectFit: "contain" }}
                    />
                  )}
                  <button
                    onClick={() => sigRef.current.click()}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {signature ? "Change Signature" : "Upload Signature"}
                  </button>
                  <input
                    ref={sigRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSig}
                    style={{ display: "none" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={set("notes")}
                  rows={3}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setPreview(false)}
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              ← Edit
            </button>
            <button
              onClick={handleDownload}
              style={{
                fontSize: 13,
                padding: "8px 16px",
                background: "#e8001d",
                color: "#fff",
                border: "none",
                borderRadius: "var(--border-radius-md)",
                cursor: "pointer",
              }}
            >
              {downloading ? "Generating PDF..." : "Download PDF"}
            </button>
            <button
              onClick={handleEmail}
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              Send via Email
            </button>
          </div>

          {/* Invoice Preview */}
          <div
            ref={invoiceRef}
            style={{
              background: "#fff",
              color: "#111",
              padding: "48px",
              fontFamily: "Georgia, serif",
              maxWidth: 794,
              margin: "0 auto",
              border: "0.5px solid #e0e0e0",
              borderRadius: 8,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 40,
              }}
            >
              <div>
                {logo && (
                  <img
                    src={logo}
                    alt="logo"
                    style={{
                      height: 56,
                      objectFit: "contain",
                      marginBottom: 12,
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: -0.5,
                    color: "#111",
                  }}
                >
                  {form.companyName}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#555",
                    marginTop: 4,
                    lineHeight: 1.6,
                    maxWidth: 260,
                  }}
                >
                  {form.companyAddress}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {form.companyEmail} · {form.companyPhone}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  GSTIN: {form.companyGST}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#e8001d",
                    letterSpacing: -1,
                  }}
                >
                  INVOICE
                </div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 8 }}>
                  Invoice No:{" "}
                  <strong style={{ color: "#111" }}>
                    {form.invoiceNumber}
                  </strong>
                </div>
                <div style={{ fontSize: 13, color: "#555" }}>
                  Date:{" "}
                  <strong style={{ color: "#111" }}>{form.invoiceDate}</strong>
                </div>
                <div style={{ fontSize: 13, color: "#555" }}>
                  Due: <strong style={{ color: "#111" }}>{form.dueDate}</strong>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    padding: "4px 12px",
                    background: "#fff3f3",
                    border: "1px solid #e8001d",
                    borderRadius: 4,
                    display: "inline-block",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "#e8001d", fontWeight: 600 }}
                  >
                    {form.paymentTerms}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  background: "#f9f9f9",
                  borderRadius: 6,
                  padding: "16px 20px",
                  borderLeft: "3px solid #e8001d",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: "#888",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Bill To
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>
                  {form.customerName || "—"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#555",
                    marginTop: 4,
                    lineHeight: 1.6,
                  }}
                >
                  {form.customerAddress}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {form.customerEmail}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {form.customerPhone}
                </div>
                {form.customerGST && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    GSTIN: {form.customerGST}
                  </div>
                )}
              </div>
              <div
                style={{
                  background: "#f9f9f9",
                  borderRadius: 6,
                  padding: "16px 20px",
                  borderLeft: "3px solid #333",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: "#888",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Shipment Details
                </div>
                {form.shipmentId && (
                  <div style={{ fontSize: 12, color: "#555" }}>
                    ID:{" "}
                    <strong style={{ color: "#111" }}>{form.shipmentId}</strong>
                  </div>
                )}
                {form.origin && (
                  <div style={{ fontSize: 12, color: "#555" }}>
                    From:{" "}
                    <strong style={{ color: "#111" }}>{form.origin}</strong>
                  </div>
                )}
                {form.destination && (
                  <div style={{ fontSize: 12, color: "#555" }}>
                    To:{" "}
                    <strong style={{ color: "#111" }}>
                      {form.destination}
                    </strong>
                  </div>
                )}
                {form.weight && (
                  <div style={{ fontSize: 12, color: "#555" }}>
                    Weight:{" "}
                    <strong style={{ color: "#111" }}>{form.weight} kg</strong>
                  </div>
                )}
                {form.vehicleType && (
                  <div style={{ fontSize: 12, color: "#555" }}>
                    Vehicle:{" "}
                    <strong style={{ color: "#111" }}>
                      {form.vehicleType}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Charges Table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: 24,
              }}
            >
              <thead>
                <tr style={{ background: "#111" }}>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      color: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      color: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Freight Charge", form.freightCharge],
                  ["Handling Charge", form.handlingCharge],
                  ["Fuel Surcharge", form.fuelSurcharge],
                ]
                  .filter(([, v]) => parseFloat(v) > 0)
                  .map(([label, val], i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "0.5px solid #eee",
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#333",
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#333",
                          textAlign: "right",
                        }}
                      >
                        {fmt(parseFloat(val) || 0)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Totals */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 32,
              }}
            >
              <div style={{ width: 280 }}>
                {[
                  ["Subtotal", subtotal],
                  ["CGST @ 9%", cgst],
                  ["SGST @ 9%", sgst],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "0.5px solid #eee",
                      fontSize: 13,
                      color: "#555",
                    }}
                  >
                    <span>{label}</span>
                    <span>{fmt(val)}</span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#e8001d",
                    borderRadius: 6,
                    marginTop: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}
                  >
                    Total Due
                  </span>
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}
                  >
                    {fmt(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes + Signature */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                marginTop: 16,
                paddingTop: 24,
                borderTop: "0.5px solid #eee",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: "#888",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Notes & Terms
                </div>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
                  {form.notes}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: "#888",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Authorised Signatory
                </div>
                {signature ? (
                  <img
                    src={signature}
                    alt="signature"
                    style={{
                      height: 60,
                      objectFit: "contain",
                      marginBottom: 8,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 60,
                      marginBottom: 8,
                      borderBottom: "1px dashed #ccc",
                    }}
                  />
                )}
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
                  {form.companyName}
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>
                  Authorised Signature
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: 32,
                paddingTop: 16,
                borderTop: "2px solid #e8001d",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "#888" }}>
                Generated by RouteX AI Logistics Platform
              </div>
              <div style={{ fontSize: 11, color: "#888" }}>
                {form.invoiceNumber} · {form.invoiceDate}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
