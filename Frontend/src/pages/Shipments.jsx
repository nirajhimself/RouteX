import { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { PageLoader, ErrorState } from "../components/Loader";
import { shipmentService } from "../services/shipmentService";
import { driverService } from "../services/driverService";
import { COMPANY_ID } from "../config";
import { PlusIcon, EyeIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import api from "../api/api";

const STATUS_BADGE = {
  in_transit: "badge-blue",
  "In Transit": "badge-blue",
  delivered: "badge-green",
  Delivered: "badge-green",
  pending: "badge-yellow",
  Pending: "badge-yellow",
  delayed: "badge-red",
  Delayed: "badge-red",
  cancelled: "badge-gray",
  Cancelled: "badge-gray",
};

const NEXT_STATUS = {
  Pending: "In Transit",
  pending: "In Transit",
  "In Transit": "Delivered",
  in_transit: "Delivered",
};

const NEXT_LABEL = {
  Pending: "▶ In Transit",
  pending: "▶ In Transit",
  "In Transit": "✓ Delivered",
  in_transit: "✓ Delivered",
};

const NEXT_COLOR = {
  Pending: "#60a5fa",
  pending: "#60a5fa",
  "In Transit": "#4ade80",
  in_transit: "#4ade80",
};

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const [form, setForm] = useState({
    pickup_location: "",
    delivery_location: "",
    weight: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shipRes, drvRes] = await Promise.all([
        shipmentService.getAll(COMPANY_ID),
        driverService.getAll(COMPANY_ID),
      ]);
      const list = Array.isArray(shipRes.data)
        ? shipRes.data
        : (shipRes.data?.shipments ?? shipRes.data?.data ?? []);
      const drvList = Array.isArray(drvRes.data)
        ? drvRes.data
        : (drvRes.data?.drivers ?? drvRes.data?.data ?? []);
      setShipments(list);
      setDrivers(drvList);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ✅ Assign driver to shipment
  const handleAssign = async () => {
    if (!selectedDriverId) {
      alert("Select a driver first");
      return;
    }
    setAssigning(true);
    try {
      await api.patch(`/shipment/${selected.id}/assign`, {
        driver_id: parseInt(selectedDriverId),
      });
      await load();
      setAssignOpen(false);
      setSelected(null);
      setSelectedDriverId("");
    } catch (err) {
      alert(
        err?.response?.data?.detail ||
          "Failed to assign driver. Make sure the column exists in DB.",
      );
    } finally {
      setAssigning(false);
    }
  };

  // ✅ Advance status
  const handleStatusAdvance = async (shipment) => {
    const next = NEXT_STATUS[shipment.status];
    if (!next) return;
    setUpdatingId(shipment.id);
    try {
      await api.patch(`/shipment/${shipment.id}/status`, { status: next });
      setShipments((prev) =>
        prev.map((s) => (s.id === shipment.id ? { ...s, status: next } : s)),
      );
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdd = async () => {
    if (!form.pickup_location || !form.delivery_location) {
      setFormError("Pickup and delivery are required");
      return;
    }
    if (!form.weight || isNaN(Number(form.weight))) {
      setFormError("Please enter a valid weight");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await shipmentService.create({
        company_id: COMPANY_ID,
        pickup_location: form.pickup_location,
        delivery_location: form.delivery_location,
        weight: parseFloat(form.weight),
      });
      await load();
      setAddOpen(false);
      setForm({ pickup_location: "", delivery_location: "", weight: "" });
    } catch (err) {
      setFormError(err?.response?.data?.detail || "Failed to create shipment");
    } finally {
      setSaving(false);
    }
  };

  const openAssign = (row) => {
    setSelected(row);
    setSelectedDriverId(row.driver_id?.toString() || "");
    setAssignOpen(true);
  };

  const COLS = [
    {
      key: "shipment_id",
      label: "Shipment ID",
      render: (v) => (
        <span className="font-mono text-xs text-brand-red font-bold">{v}</span>
      ),
    },
    {
      key: "pickup_location",
      label: "Pickup",
      render: (v) => <span className="text-xs">{v || "—"}</span>,
    },
    {
      key: "delivery_location",
      label: "Delivery",
      render: (v) => <span className="text-xs">{v || "—"}</span>,
    },
    {
      key: "weight",
      label: "Weight",
      render: (v) => (
        <span className="font-mono text-xs">{v ? `${v} kg` : "—"}</span>
      ),
    },
    {
      key: "driver_id",
      label: "Driver",
      render: (v) => {
        const driver = drivers.find((d) => d.id === v);
        return driver ? (
          <span className="text-xs text-blue-400 font-medium">
            {driver.name}
          </span>
        ) : (
          <span className="text-xs text-slate-600 font-mono">Unassigned</span>
        );
      },
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
    {
      key: "_action",
      label: "Update",
      render: (_, row) => {
        const next = NEXT_STATUS[row.status];
        if (!next)
          return (
            <span className="font-mono text-[10px] text-slate-600">
              {(row.status || "").toLowerCase() === "delivered"
                ? "✓ Done"
                : "—"}
            </span>
          );
        return (
          <button
            onClick={() => handleStatusAdvance(row)}
            disabled={updatingId === row.id}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all disabled:opacity-50 whitespace-nowrap"
            style={{
              color: NEXT_COLOR[row.status],
              borderColor: `${NEXT_COLOR[row.status]}30`,
              background: `${NEXT_COLOR[row.status]}10`,
            }}
          >
            {updatingId === row.id ? "…" : NEXT_LABEL[row.status]}
          </button>
        );
      },
    },
  ];

  if (loading) return <PageLoader label="Loading shipments…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const statusCount = (s) =>
    shipments.filter(
      (x) =>
        (x.status || "").toLowerCase().replace(/ /g, "_") ===
        s.toLowerCase().replace(/ /g, "_"),
    ).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Shipment Control</h1>
          <p className="section-sub">
            // {shipments.length} records · click 👤 to assign driver
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <PlusIcon className="w-4 h-4" />
          New Shipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["All", shipments.length, "#60a5fa"],
          ["In Transit", statusCount("in_transit"), "#60a5fa"],
          ["Delivered", statusCount("delivered"), "#4ade80"],
          ["Pending", statusCount("pending"), "#fbbf24"],
          ["Delayed", statusCount("delayed"), "#f87171"],
        ].map(([s, v, c]) => (
          <div key={s} className="card p-4">
            <p
              className="font-bold leading-none mb-1"
              style={{ fontFamily: "Syne,sans-serif", fontSize: 28, color: c }}
            >
              {v}
            </p>
            <p className="text-xs text-slate-500">{s}</p>
          </div>
        ))}
      </div>

      <Table
        columns={COLS}
        data={shipments}
        filters={["In Transit", "Delivered", "Pending", "Delayed", "Cancelled"]}
        title="Shipments"
        onAction={(row) => (
          <div className="flex gap-1">
            {/* 👤 Assign Driver button */}
            <button
              onClick={() => openAssign(row)}
              title="Assign Driver"
              className="p-1.5 rounded-md border border-dark-500 text-slate-500 hover:text-blue-400 hover:border-blue-400/30 transition-all"
            >
              <UserPlusIcon className="w-3.5 h-3.5" />
            </button>
            {/* 👁 Detail button */}
            <button
              onClick={() => {
                setSelected(row);
                setDetailOpen(true);
              }}
              className="p-1.5 rounded-md border border-dark-500 text-slate-500 hover:text-slate-300 transition-all"
            >
              <EyeIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* ✅ Assign Driver Modal */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Driver"
      >
        {selected && (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-dark-800 rounded-xl border border-dark-600">
              <p className="text-[10px] text-slate-500 font-mono mb-1">
                SHIPMENT
              </p>
              <p className="text-sm font-semibold">
                {selected.pickup_location} → {selected.delivery_location}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {selected.weight} kg · {selected.status}
              </p>
            </div>

            <div>
              <label className="label">Select Driver</label>
              {drivers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No drivers found. Add drivers first.
                </p>
              ) : (
                <select
                  className="select"
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                  <option value="">— Choose a driver —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.phone ? `· ${d.phone}` : ""}{" "}
                      {d.is_available ? "✓ Available" : "· Busy"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="btn-ghost flex-1"
                onClick={() => setAssignOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1 justify-center"
                onClick={handleAssign}
                disabled={assigning || !selectedDriverId}
              >
                {assigning ? "Assigning…" : "Assign Driver"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Shipment Details"
      >
        {selected && (
          <div className="space-y-3">
            {[
              ["Shipment ID", selected.shipment_id || selected.id],
              ["Pickup", selected.pickup_location],
              ["Delivery", selected.delivery_location],
              ["Weight", selected.weight ? `${selected.weight} kg` : "—"],
              [
                "Driver",
                drivers.find((d) => d.id === selected.driver_id)?.name ||
                  "Unassigned",
              ],
              ["Status", selected.status],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between items-center py-2 border-b border-dark-700"
              >
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-xs font-mono font-semibold">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Shipment"
      >
        <div className="space-y-4">
          {formError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {formError}
            </div>
          )}
          {[
            [
              "Pickup Location *",
              "pickup_location",
              "text",
              "e.g. Mumbai, Maharashtra",
            ],
            [
              "Delivery Location *",
              "delivery_location",
              "text",
              "e.g. Delhi, NCR",
            ],
            ["Weight (kg) *", "weight", "number", "e.g. 340"],
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
              {saving ? "Creating…" : "Create Shipment"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
