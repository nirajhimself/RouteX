import { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { PageLoader, ErrorState } from "../components/Loader";
import { vehicleService } from "../services/vehicleService";
import { COMPANY_ID } from "../config";
import { PlusIcon, PencilIcon, EyeIcon } from "@heroicons/react/24/outline";
import { getErrorMessage } from "../utils/errorHelper";
const STATUS_BADGE = {
  "in use": "badge-blue",
  "In Use": "badge-blue",
  available: "badge-green",
  Available: "badge-green",
  maintenance: "badge-yellow",
  Maintenance: "badge-yellow",
};
const FUEL_COLOR = {
  Electric: "#4ade80",
  CNG: "#60a5fa",
  Diesel: "#94a3b8",
  Petrol: "#fbbf24",
};

const COLS = [
  {
    key: "vehicle_id",
    label: "Unit ID",
    render: (v) => (
      <span className="font-mono text-xs text-brand-red font-bold">{v}</span>
    ),
  },
  { key: "type", label: "Classification" },
  { key: "license_plate", label: "Plate", mono: true },
  {
    key: "capacity",
    label: "Capacity",
    render: (v) => <span className="font-mono text-sm font-bold">{v}</span>,
  },
  {
    key: "fuel_type",
    label: "Fuel",
    render: (v) => (
      <span
        className="font-mono text-xs px-2 py-0.5 rounded border"
        style={{
          color: FUEL_COLOR[v] || "#94a3b8",
          background: `${FUEL_COLOR[v] || "#94a3b8"}12`,
          borderColor: `${FUEL_COLOR[v] || "#94a3b8"}25`,
        }}
      >
        {v || "—"}
      </span>
    ),
  },
  {
    key: "driver_id",
    label: "Assigned Driver",
    render: (v) => <span className="text-xs text-slate-400">{v || "—"}</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (v) => (
      <span className={`badge ${STATUS_BADGE[v] || "badge-gray"}`}>
        <span className="w-1 h-1 rounded-full bg-current" />
        {v || "—"}
      </span>
    ),
  },
];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    type: "",
    license_plate: "",
    capacity: "",
    fuel_type: "Diesel",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vehicleService.getAll(COMPANY_ID);
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.vehicles ?? res.data?.data ?? []);
      setVehicles(list);
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to register vehicle"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!form.type || !form.license_plate) {
      setFormError("Type and plate required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await vehicleService.create({
        company_id: COMPANY_ID,
        vehicle_number: form.license_plate, // ✅ rename
        vehicle_type: form.type, // ✅ rename
        capacity: parseFloat(form.capacity) || 0, // ✅ ensure float
        fuel_type: form.fuel_type,
      });
      await load();
      setAddOpen(false);
      setForm({
        type: "",
        license_plate: "",
        capacity: "",
        fuel_type: "Diesel",
      });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setFormError(detail.map((d) => d.msg || JSON.stringify(d)).join(", "));
      } else if (typeof detail === "string") {
        setFormError(detail);
      } else {
        setFormError("Failed to register vehicle");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading vehicles…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const inUse = vehicles.filter((v) =>
    (v.status || "").toLowerCase().includes("use"),
  ).length;
  const avail = vehicles.filter(
    (v) => (v.status || "").toLowerCase() === "available",
  ).length;
  const maint = vehicles.filter((v) =>
    (v.status || "").toLowerCase().includes("maint"),
  ).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Fleet Registry</h1>
          <p className="section-sub">
            // vehicle inventory · {vehicles.length} units from database
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <PlusIcon className="w-4 h-4" />
          Register Vehicle
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Total", vehicles.length, "#60a5fa"],
          ["In Use", inUse, "#e8001d"],
          ["Available", avail, "#4ade80"],
          ["Maintenance", maint, "#fbbf24"],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-4">
            <p
              className="font-bold leading-none mb-1"
              style={{ fontFamily: "Syne,sans-serif", fontSize: 32, color: c }}
            >
              {v}
            </p>
            <p className="text-xs text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      <Table
        columns={COLS}
        data={vehicles}
        filters={["In Use", "Available", "Maintenance"]}
        title="Vehicle Fleet"
        onAction={(row) => (
          <>
            <button className="p-1.5 rounded-md border border-dark-500 text-slate-500 hover:text-slate-300 transition-all">
              <EyeIcon className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-md border border-dark-500 text-slate-500 hover:text-slate-300 transition-all">
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Register Vehicle"
      >
        <div className="space-y-4">
          {formError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {formError}
            </div>
          )}
          {[
            ["Vehicle Type *", "type", "text", "e.g. Heavy Truck"],
            ["License Plate *", "license_plate", "text", "e.g. MH-04-AB-1234"],
            ["Capacity", "capacity", "text", "e.g. 10T"],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                type={type}
                placeholder={ph}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="input"
              />
            </div>
          ))}
          <div>
            <label className="label">Fuel Type</label>
            <select
              className="select"
              value={form.fuel_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, fuel_type: e.target.value }))
              }
            >
              {["Diesel", "Petrol", "CNG", "Electric"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="btn-ghost flex-1"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex-1 justify-center"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? "Registering…" : "Register"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
