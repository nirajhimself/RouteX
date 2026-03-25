import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { COMPANY_ID } from "../config";
import {
  BuildingOfficeIcon,
  UserIcon,
  PlusIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  QrCodeIcon,
  TruckIcon,
  ArrowLeftIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  "Type & Client",
  "Package Details",
  "Choose Carrier",
  "Confirmation",
];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < current
                  ? "bg-emerald-500 text-white"
                  : i === current
                    ? "bg-brand-red text-white"
                    : "bg-dark-700 text-slate-600"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <p
              className={`text-[9px] font-mono mt-1 whitespace-nowrap ${
                i === current ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {label}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-px mx-2 mb-4 transition-all ${i < current ? "bg-emerald-500" : "bg-dark-600"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── QR Code (using free QR API) ─────────────────────────────────────────────
function QRCode({ value, size = 160 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0d1117&color=ffffff&margin=10`;
  return (
    <img
      src={url}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl border border-dark-500"
    />
  );
}

// ─── Carrier badge ────────────────────────────────────────────────────────────
function CarrierCard({ rate, selected, onSelect, isCheapest }) {
  const isSelected =
    selected?.carrier === rate.carrier &&
    selected?.service_type === rate.service_type;
  return (
    <div
      onClick={() => onSelect(rate)}
      className="cursor-pointer rounded-xl border p-4 transition-all relative"
      style={{
        borderColor: isSelected ? `${rate.color}60` : "#1f2a3c",
        background: isSelected ? `${rate.color}08` : "transparent",
        boxShadow: isSelected ? `0 0 0 1px ${rate.color}30` : "none",
      }}
    >
      {isCheapest && (
        <span className="absolute -top-2 left-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
          CHEAPEST
        </span>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{rate.logo}</span>
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: rate.color, fontFamily: "Syne,sans-serif" }}
            >
              {rate.carrier}
            </p>
            <p className="text-[10px] text-slate-600 font-mono">
              {rate.service_type}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-lg font-bold"
            style={{ fontFamily: "Syne,sans-serif", color: rate.color }}
          >
            ₹{rate.rate}
          </p>
          <p className="text-[10px] text-slate-500">
            {rate.estimated_days} days
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {rate.features.map((f, i) => (
          <span
            key={i}
            className="text-[9px] px-1.5 py-0.5 rounded bg-dark-700 text-slate-500 border border-dark-600"
          >
            {f}
          </span>
        ))}
      </div>
      {isSelected && (
        <div
          className="mt-3 flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: rate.color }}
        >
          <CheckCircleIcon className="w-3.5 h-3.5" /> Selected
        </div>
      )}
    </div>
  );
}

// ─── STEP 1: Type + Client ────────────────────────────────────────────────────
function Step1({ data, onChange, onNext }) {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    company_name: "",
    gst_number: "",
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const loadClients = async (type) => {
    setLoadingClients(true);
    try {
      const res = await api.get(`/clients/${COMPANY_ID}`);
      const all = Array.isArray(res.data) ? res.data : [];
      setClients(all.filter((c) => c.type === type));
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    if (data.type) loadClients(data.type);
  }, [data.type]);

  const handleSaveNewClient = async () => {
    if (!newClient.name || !newClient.city) {
      alert("Name and city required");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/clients/create", {
        ...newClient,
        company_id: COMPANY_ID,
        type: data.type,
      });
      onChange("client", res.data);
      setShowNewForm(false);
      await loadClients(data.type);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase()),
  );

  const canProceed = data.type && data.client;

  return (
    <div className="space-y-6">
      {/* B2B / B2C toggle */}
      <div>
        <p className="label mb-3">Shipment Type</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              type: "B2B",
              icon: BuildingOfficeIcon,
              title: "B2B",
              sub: "Business to Business",
              desc: "Merchant → Merchant / Retailer",
            },
            {
              type: "B2C",
              icon: UserIcon,
              title: "B2C",
              sub: "Business to Customer",
              desc: "Merchant → End Customer / Individual",
            },
          ].map(({ type, icon: Icon, title, sub, desc }) => {
            const sel = data.type === type;
            return (
              <div
                key={type}
                onClick={() => {
                  onChange("type", type);
                  onChange("client", null);
                  setSearch("");
                  setShowNewForm(false);
                }}
                className="cursor-pointer rounded-xl border p-5 transition-all"
                style={{
                  borderColor: sel ? "#e8001d60" : "#1f2a3c",
                  background: sel ? "#e8001d08" : "transparent",
                }}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${sel ? "bg-brand-red/20 border border-brand-red/40" : "bg-dark-700 border border-dark-600"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${sel ? "text-brand-red" : "text-slate-600"}`}
                  />
                </div>
                <p
                  className="font-bold text-base"
                  style={{
                    fontFamily: "Syne,sans-serif",
                    color: sel ? "#e8001d" : undefined,
                  }}
                >
                  {title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                <p className="text-[10px] text-slate-600 font-mono mt-1">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client selection */}
      {data.type && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="label">
              Select {data.type === "B2B" ? "Business Client" : "Customer"}
            </p>
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="flex items-center gap-1 text-xs text-brand-red hover:text-red-400 transition-all"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              {showNewForm ? "Cancel" : "Add New"}
            </button>
          </div>

          {/* New client form */}
          <AnimatePresence>
            {showNewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="card p-4 mb-4 space-y-3"
              >
                <p className="text-xs font-semibold text-slate-400">
                  New {data.type === "B2B" ? "Business" : "Customer"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Name *</label>
                    <input
                      className="input"
                      placeholder="Full name"
                      value={newClient.name}
                      onChange={(e) =>
                        setNewClient((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      className="input"
                      placeholder="Phone number"
                      value={newClient.phone}
                      onChange={(e) =>
                        setNewClient((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input"
                      placeholder="Email address"
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">City *</label>
                    <input
                      className="input"
                      placeholder="City"
                      value={newClient.city}
                      onChange={(e) =>
                        setNewClient((p) => ({ ...p, city: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Address</label>
                    <input
                      className="input"
                      placeholder="Street address"
                      value={newClient.address}
                      onChange={(e) =>
                        setNewClient((p) => ({ ...p, address: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Pincode</label>
                    <input
                      className="input"
                      placeholder="6-digit pincode"
                      value={newClient.pincode}
                      onChange={(e) =>
                        setNewClient((p) => ({ ...p, pincode: e.target.value }))
                      }
                    />
                  </div>
                  {data.type === "B2B" && (
                    <>
                      <div>
                        <label className="label">Company Name</label>
                        <input
                          className="input"
                          placeholder="Business name"
                          value={newClient.company_name}
                          onChange={(e) =>
                            setNewClient((p) => ({
                              ...p,
                              company_name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="label">GST Number</label>
                        <input
                          className="input"
                          placeholder="GST registration"
                          value={newClient.gst_number}
                          onChange={(e) =>
                            setNewClient((p) => ({
                              ...p,
                              gst_number: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleSaveNewClient}
                  disabled={saving}
                  className="btn-primary justify-center w-full py-2 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save & Select"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search existing */}
          {!showNewForm && (
            <input
              className="input mb-3"
              placeholder={`Search ${data.type === "B2B" ? "businesses" : "customers"}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {/* Client list */}
          {loadingClients ? (
            <p className="text-xs text-slate-500 font-mono text-center py-4 animate-pulse">
              Loading clients…
            </p>
          ) : filtered.length === 0 && !showNewForm ? (
            <div className="card p-6 text-center">
              <p className="text-slate-500 text-sm">
                No {data.type} clients yet.
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">
                Click "Add New" to add your first client.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filtered.map((c) => {
                const isSelected = data.client?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => onChange("client", c)}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                    style={{
                      borderColor: isSelected ? "#e8001d40" : "#1f2a3c",
                      background: isSelected ? "#e8001d06" : "transparent",
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                      style={{ background: isSelected ? "#e8001d" : "#334155" }}
                    >
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {c.city}
                        {c.company_name ? ` · ${c.company_name}` : ""}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircleIcon className="w-4 h-4 text-brand-red flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="btn-primary w-full justify-center py-3 disabled:opacity-40"
      >
        Continue to Package Details <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── STEP 2: Package Details ──────────────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack }) {
  const f = data.package || {};
  const c = data.client || {};
  const set = (key, val) => onChange("package", { ...f, [key]: val });

  const volumetric =
    f.length && f.width && f.height
      ? ((f.length * f.width * f.height) / 5000).toFixed(2)
      : null;

  const chargeableWeight = volumetric
    ? Math.max(parseFloat(f.weight || 0), parseFloat(volumetric)).toFixed(2)
    : f.weight;

  // ✅ FIX: check actual field OR client fallback — both count as filled
  const effectiveCity = f.receiver_city || c.city || "";
  const effectiveAddress = f.receiver_address || c.address || "";
  const effectivePincode = f.receiver_pincode || c.pincode || "";
  const canProceed =
    f.weight && effectiveAddress && effectiveCity && effectivePincode;

  return (
    <div className="space-y-5">
      {/* Selected client info */}
      {data.client && (
        <div className="px-4 py-3 rounded-xl bg-dark-800 border border-dark-600 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-xs font-bold text-white">
            {data.client.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold">{data.client.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">
              {data.type} · {data.client.city}
              {data.client.company_name ? ` · ${data.client.company_name}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Sender info */}
      <div>
        <p className="label mb-3">📦 Sender (Pickup Address)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Sender Name</label>
            <input
              className="input"
              placeholder="Your name / company"
              value={f.sender_name || ""}
              onChange={(e) => set("sender_name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pickup City</label>
            <input
              className="input"
              placeholder="e.g. Mumbai"
              value={f.sender_city || ""}
              onChange={(e) => set("sender_city", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Pickup Address</label>
            <input
              className="input"
              placeholder="Street / area / building"
              value={f.sender_address || ""}
              onChange={(e) => set("sender_address", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pickup Pincode</label>
            <input
              className="input"
              placeholder="6-digit pincode"
              value={f.sender_pincode || ""}
              onChange={(e) => set("sender_pincode", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Receiver info */}
      <div>
        <p className="label mb-3">📍 Receiver (Delivery Address)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Receiver Name *</label>
            <input
              className="input"
              placeholder="Recipient name"
              value={f.receiver_name || data.client?.name || ""}
              onChange={(e) => set("receiver_name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              placeholder="Receiver phone"
              value={f.receiver_phone || data.client?.phone || ""}
              onChange={(e) => set("receiver_phone", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Delivery Address *</label>
            <input
              className="input"
              placeholder="Street / area / building"
              value={f.receiver_address || data.client?.address || ""}
              onChange={(e) => set("receiver_address", e.target.value)}
            />
          </div>
          <div>
            <label className="label">City *</label>
            <input
              className="input"
              placeholder="Delivery city"
              value={f.receiver_city || data.client?.city || ""}
              onChange={(e) => set("receiver_city", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pincode *</label>
            <input
              className="input"
              placeholder="6-digit pincode"
              value={f.receiver_pincode || data.client?.pincode || ""}
              onChange={(e) => set("receiver_pincode", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Product details */}
      <div>
        <p className="label mb-3">📋 Product / Package Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Product Name</label>
            <input
              className="input"
              placeholder="e.g. Electronics, Clothes"
              value={f.product_name || ""}
              onChange={(e) => set("product_name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Declared Value (₹)</label>
            <input
              className="input"
              type="number"
              placeholder="e.g. 5000"
              value={f.declared_value || ""}
              onChange={(e) => set("declared_value", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="Brief description of contents"
              value={f.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Weight + Dimensions */}
      <div>
        <p className="label mb-3">⚖️ Weight & Dimensions</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Actual Weight (kg) *</label>
            <input
              className="input"
              type="number"
              step="0.1"
              placeholder="e.g. 2.5"
              value={f.weight || ""}
              onChange={(e) => set("weight", e.target.value)}
            />
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <div>
              <label className="label">Length (cm)</label>
              <input
                className="input"
                type="number"
                placeholder="L"
                value={f.length || ""}
                onChange={(e) => set("length", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Width (cm)</label>
              <input
                className="input"
                type="number"
                placeholder="W"
                value={f.width || ""}
                onChange={(e) => set("width", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input
                className="input"
                type="number"
                placeholder="H"
                value={f.height || ""}
                onChange={(e) => set("height", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Volumetric weight */}
        {volumetric && (
          <div className="mt-3 px-4 py-3 rounded-xl bg-dark-800 border border-dark-600">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono">
                Volumetric Weight
              </span>
              <span className="font-bold">{volumetric} kg</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-slate-500 font-mono">
                Chargeable Weight
              </span>
              <span className="font-bold text-yellow-400">
                {chargeableWeight} kg
              </span>
            </div>
            <p className="text-[9px] text-slate-600 font-mono mt-1">
              Carriers charge the higher of actual vs volumetric weight
              (L×W×H÷5000)
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-ghost flex-1 justify-center">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary flex-2 flex-1 justify-center py-3 disabled:opacity-40"
        >
          Get Carrier Rates <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3: Choose Carrier ───────────────────────────────────────────────────
function Step3({ data, onChange, onNext, onBack }) {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const f = data.package || {};

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const w = parseFloat(f.weight) || 1;
        const dest = f.receiver_city || data.client?.city || "Delhi";
        const origin = f.sender_city || "Mumbai";
        const res = await api.get(
          `/carrier-rates?weight=${w}&destination=${dest}&origin=${origin}`,
        );
        setRates(res.data.rates || []);
      } catch {
        setRates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const cheapestRate =
    rates.length > 0 ? Math.min(...rates.map((r) => r.rate)) : null;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ["From", `${f.sender_city || "—"}`, "📦"],
          ["To", `${f.receiver_city || "—"}`, "📍"],
          ["Weight", `${f.weight || "—"} kg`, "⚖️"],
        ].map(([l, v, icon]) => (
          <div key={l} className="card p-3 text-center">
            <p className="text-base">{icon}</p>
            <p
              className="text-xs font-bold mt-1"
              style={{ fontFamily: "Syne,sans-serif" }}
            >
              {v}
            </p>
            <p className="text-[9px] text-slate-600 font-mono">{l}</p>
          </div>
        ))}
      </div>

      {/* Rates */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-slate-500 text-sm font-mono animate-pulse">
            Fetching carrier rates…
          </span>
        </div>
      ) : (
        <>
          <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">
            {rates.length} options · sorted by price
          </p>
          <div className="space-y-3">
            {rates.map((rate, i) => (
              <CarrierCard
                key={i}
                rate={rate}
                selected={data.carrier}
                onSelect={(r) => onChange("carrier", r)}
                isCheapest={rate.rate === cheapestRate}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-ghost flex-1 justify-center">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!data.carrier}
          className="btn-primary flex-1 justify-center py-3 disabled:opacity-40"
        >
          Confirm Booking <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 4: Confirmation + QR ───────────────────────────────────────────────
function Step4({ data, onReset }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const f = data.package || {};

  useEffect(() => {
    const createBooking = async () => {
      try {
        const res = await api.post("/bookings/create", {
          company_id: COMPANY_ID,
          booking_type: data.type,
          sender_name: f.sender_name,
          sender_address: f.sender_address,
          sender_city: f.sender_city,
          sender_pincode: f.sender_pincode,
          client_id: data.client?.id || null,
          receiver_name: f.receiver_name || data.client?.name,
          receiver_phone: f.receiver_phone || data.client?.phone,
          receiver_address: f.receiver_address || data.client?.address || "",
          receiver_city: f.receiver_city || data.client?.city || "",
          receiver_pincode: f.receiver_pincode || data.client?.pincode || "",
          product_name: f.product_name,
          description: f.description,
          weight_kg: parseFloat(f.weight),
          length_cm: parseFloat(f.length) || null,
          width_cm: parseFloat(f.width) || null,
          height_cm: parseFloat(f.height) || null,
          declared_value: parseFloat(f.declared_value) || null,
          carrier: data.carrier.carrier,
          service_type: data.carrier.service_type,
          carrier_rate: data.carrier.rate,
          estimated_days: data.carrier.estimated_days,
        });
        setBooking(res.data);
      } catch (err) {
        setError(err?.response?.data?.detail || "Booking failed. Try again.");
      } finally {
        setLoading(false);
      }
    };
    createBooking();
  }, []);

  const copyTracking = () => {
    navigator.clipboard.writeText(booking.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <span className="w-10 h-10 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-mono">Creating booking…</p>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-10">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button onClick={onReset} className="btn-ghost">
          Start Over
        </button>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5"
    >
      {/* Success header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
          <CheckCircleIcon className="w-7 h-7 text-emerald-400" />
        </div>
        <h2
          className="text-lg font-bold text-emerald-400"
          style={{ fontFamily: "Syne,sans-serif" }}
        >
          Booking Confirmed!
        </h2>
        <p className="text-slate-500 text-xs font-mono mt-1">
          Your shipment has been booked with {booking.carrier}
        </p>
      </div>

      {/* Tracking + QR */}
      <div className="card p-5">
        <div className="flex items-start gap-5">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <QRCode value={booking.tracking_number} size={140} />
            <p className="text-[9px] text-slate-600 font-mono">Scan to track</p>
          </div>

          {/* Tracking info */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-1">
                Tracking Number
              </p>
              <div className="flex items-center gap-2">
                <p
                  className="text-xl font-bold font-mono tracking-wider"
                  style={{
                    fontFamily: "Syne,sans-serif",
                    color: data.carrier?.color || "#e8001d",
                  }}
                >
                  {booking.tracking_number}
                </p>
                <button
                  onClick={copyTracking}
                  className="p-1.5 rounded-lg border border-dark-500 text-slate-500 hover:text-slate-300 transition-all"
                >
                  <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              {copied && (
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  ✓ Copied!
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Carrier", `${booking.carrier} ${booking.service_type}`],
                ["Est. Days", `${booking.estimated_days} days`],
                ["Rate", `₹${booking.carrier_rate}`],
                ["Status", booking.status],
                ["Type", data.type],
                ["Client", data.client?.name || "—"],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="bg-dark-800 rounded-lg px-2.5 py-2 border border-dark-600"
                >
                  <p className="text-[9px] text-slate-600 font-mono uppercase">
                    {l}
                  </p>
                  <p className="text-xs font-semibold truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Package summary */}
      <div className="card p-4">
        <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mb-3">
          Package Summary
        </p>
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          {[
            ["Product", f.product_name || "—"],
            ["Weight", `${f.weight} kg`],
            ["From", `${f.sender_city || "—"}`],
            ["To", `${f.receiver_city || data.client?.city || "—"}`],
            ["Receiver", f.receiver_name || data.client?.name || "—"],
            ["Phone", f.receiver_phone || data.client?.phone || "—"],
          ].map(([l, v]) => (
            <div key={l} className="flex items-start gap-2">
              <span className="text-slate-600 font-mono w-16 flex-shrink-0">
                {l}
              </span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handlePrint}
          className="btn-ghost flex-1 justify-center"
        >
          <PrinterIcon className="w-4 h-4" /> Print Label
        </button>
        <button onClick={onReset} className="btn-primary flex-1 justify-center">
          + New Booking
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-600 font-mono">
        Share tracking number with customer to track at /track/
        {booking.tracking_number}
      </p>
    </motion.div>
  );
}

// ─── MAIN: Booking Wizard ─────────────────────────────────────────────────────
export default function Booking() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    type: null,
    client: null,
    package: {},
    carrier: null,
  });

  const onChange = (key, val) => setData((prev) => ({ ...prev, [key]: val }));

  const reset = () => {
    setStep(0);
    setData({ type: null, client: null, package: {}, carrier: null });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">New Booking</h1>
          <p className="section-sub">// B2B · B2C · DTDC · Delhivery · DHL</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <StepBar current={step} />

        <div className="card p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="s0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Step1
                  data={data}
                  onChange={onChange}
                  onNext={() => setStep(1)}
                />
              </motion.div>
            )}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Step2
                  data={data}
                  onChange={onChange}
                  onNext={() => setStep(2)}
                  onBack={() => setStep(0)}
                />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Step3
                  data={data}
                  onChange={onChange}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Step4 data={data} onReset={reset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
