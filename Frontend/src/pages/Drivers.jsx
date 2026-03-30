import { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { PageLoader, ErrorState } from "../components/Loader";
import { driverService } from "../services/driverService";
import { COMPANY_ID } from "../config";
import { PlusIcon, PencilIcon, EyeIcon } from "@heroicons/react/24/outline";
import { getErrorMessage } from "../utils/errorHelper";
const STATUS_BADGE = {
  active: "badge-green",
  Active: "badge-green",
  "on leave": "badge-yellow",
  "On Leave": "badge-yellow",
  inactive: "badge-gray",
  Inactive: "badge-gray",
};

const COLS = [
  {
    key: "driver_id",
    label: "Driver ID",
    render: (v) => (
      <span className="font-mono text-xs text-brand-red font-bold">{v}</span>
    ),
  },
  {
    key: "name",
    label: "Operator",
    render: (v, row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand-red/10 border border-brand-red/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-brand-red">
            {(v || "?")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </span>
        </div>
        <span className="text-sm font-medium">{v || "—"}</span>
      </div>
    ),
  },
  { key: "phone", label: "Contact", mono: true },
  { key: "license_number", label: "License", mono: true },
  {
    key: "vehicle_id",
    label: "Vehicle",
    render: (v) => (
      <span className="font-mono text-xs text-blue-400">{v || "—"}</span>
    ),
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

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    license_number: "",
    vehicle_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await driverService.getAll(COMPANY_ID);
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.drivers ?? res.data?.data ?? []);
      setDrivers(list);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load drivers"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!form.name || !form.phone) {
      setFormError("Name and phone are required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await driverService.create({ ...form, company_id: COMPANY_ID });
      await load();
      setAddOpen(false);
      setForm({ name: "", phone: "", license_number: "", vehicle_id: "" });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setFormError(detail.map((d) => d.msg || JSON.stringify(d)).join(", "));
      } else {
        setFormError(
          typeof detail === "string" ? detail : "Failed to create driver",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading drivers…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const active = drivers.filter(
    (d) => (d.status || "").toLowerCase() === "active",
  ).length;
  const onLeave = drivers.filter((d) =>
    (d.status || "").toLowerCase().includes("leave"),
  ).length;
  const inactive = drivers.filter(
    (d) => (d.status || "").toLowerCase() === "inactive",
  ).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Driver Command</h1>
          <p className="section-sub">
            // operator registry · {drivers.length} total from database
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <PlusIcon className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Total", drivers.length, "#60a5fa"],
          ["Active", active, "#4ade80"],
          ["On Leave", onLeave, "#fbbf24"],
          ["Inactive", inactive, "#6b7280"],
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
        data={drivers}
        filters={["Active", "On Leave", "Inactive"]}
        title="Driver Roster"
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
        title="Add New Driver"
      >
        <div className="space-y-4">
          {formError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {formError}
            </div>
          )}
          {[
            ["Full Name *", "name", "text", "e.g. Rajan Singh"],
            ["Phone *", "phone", "tel", "e.g. +91 98200 00000"],
            [
              "License No.",
              "license_number",
              "text",
              "e.g. MH-01-2023-0012345",
            ],
            ["Assign Vehicle ID", "vehicle_id", "text", "e.g. TRK-019"],
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
              {saving ? "Adding…" : "Add Driver"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
