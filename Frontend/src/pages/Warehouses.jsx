import { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { PageLoader, ErrorState } from "../components/Loader";
import { warehouseService } from "../services/warehouseService";
import { COMPANY_ID } from "../config";
import { PlusIcon, EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import { getErrorMessage } from "../utils/errorHelper";
const COLS = [
  {
    key: "warehouse_id",
    label: "Warehouse ID",
    render: (v) => (
      <span className="font-mono text-xs text-brand-red font-bold">{v}</span>
    ),
  },
  {
    key: "name",
    label: "Name",
    render: (v) => <span className="font-medium">{v || "—"}</span>,
  },
  {
    key: "location",
    label: "Location",
    render: (v) => <span className="text-xs text-slate-400">{v || "—"}</span>,
  },
  {
    key: "capacity",
    label: "Capacity",
    render: (v) => (
      <span className="font-mono text-xs">{v ? `${v} units` : "—"}</span>
    ),
  },
];

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", capacity: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await warehouseService.getAll(COMPANY_ID);
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.warehouses ?? res.data?.data ?? []);
      setWarehouses(list);
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to create warehouse"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!form.name || !form.location) {
      setFormError("Name and location are required");
      return;
    }
    if (!form.capacity || isNaN(Number(form.capacity))) {
      setFormError("Please enter a valid capacity");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await warehouseService.create({
        company_id: COMPANY_ID, // ✅ always sent
        name: form.name,
        location: form.location,
        capacity: parseFloat(form.capacity), // ✅ always a float
      });
      await load();
      setAddOpen(false);
      setForm({ name: "", location: "", capacity: "" });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setFormError(detail.map((d) => d.msg || JSON.stringify(d)).join(", "));
      } else {
        setFormError(
          typeof detail === "string" ? detail : "Failed to create warehouse",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading warehouses…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Warehouse Network</h1>
          <p className="section-sub">
            // {warehouses.length} warehouses from database
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <PlusIcon className="w-4 h-4" />
          Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          ["Total", warehouses.length, "#818cf8"],
          ["Active", warehouses.length, "#4ade80"],
          [
            "Locations",
            new Set(warehouses.map((w) => w.location)).size,
            "#60a5fa",
          ],
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
        data={warehouses}
        title="Warehouses"
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
        title="Add Warehouse"
      >
        <div className="space-y-4">
          {formError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {formError}
            </div>
          )}
          {[
            ["Warehouse Name *", "name", "text", "e.g. Mumbai Central Hub"],
            ["Location *", "location", "text", "e.g. Mumbai, Maharashtra"],
            ["Capacity *", "capacity", "number", "e.g. 5000"],
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
              {saving ? "Adding…" : "Add Warehouse"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
