import { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { PageLoader, ErrorState, EmptyState } from "../components/Loader";
import { inventoryService } from "../services/inventoryService";
import { warehouseService } from "../services/warehouseService";
import { COMPANY_ID } from "../config";
import { PlusIcon } from "@heroicons/react/24/outline";
import { getErrorMessage } from "../utils/errorHelper";
const STATUS_BADGE = {
  in_stock: "badge-green",
  "In Stock": "badge-green",
  low_stock: "badge-yellow",
  "Low Stock": "badge-yellow",
  out_of_stock: "badge-red",
  "Out of Stock": "badge-red",
};

const COLS = [
  {
    key: "item_id",
    label: "Item ID",
    render: (v) => (
      <span className="font-mono text-xs text-brand-red">{v}</span>
    ),
  },
  {
    key: "product_name",
    label: "Product",
    render: (v) => <span className="font-medium">{v || "—"}</span>,
  },
  { key: "sku", label: "SKU", mono: true },
  {
    key: "quantity",
    label: "Qty",
    render: (v) => (
      <span
        className="font-bold text-lg"
        style={{
          fontFamily: "Syne,sans-serif",
          color: !v || v === 0 ? "#f87171" : v < 100 ? "#fbbf24" : "inherit",
        }}
      >
        {v ?? 0}
      </span>
    ),
  },
  {
    key: "warehouse_id",
    label: "Warehouse",
    render: (v) => (
      <span className="font-mono text-xs text-blue-400">{v || "—"}</span>
    ),
  },
  { key: "category", label: "Category" },
  {
    key: "status",
    label: "Status",
    render: (v) => {
      const normalized = (v || "").toLowerCase().replace(/ /g, "_");
      return (
        <span
          className={`badge ${STATUS_BADGE[normalized] || STATUS_BADGE[v] || "badge-gray"}`}
        >
          <span className="w-1 h-1 rounded-full bg-current" />
          {v || "—"}
        </span>
      );
    },
  },
];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState("");
  const [loading, setLoading] = useState(false);
  const [whLoading, setWhLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    product_name: "",
    sku: "",
    quantity: "",
    category: "",
    warehouse_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Load warehouses first
  useEffect(() => {
    (async () => {
      setWhLoading(true);
      try {
        const res = await warehouseService.getAll(COMPANY_ID);
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data?.warehouses ?? res.data?.data ?? []);
        setWarehouses(list);
        if (list.length > 0) {
          const firstId = list[0].warehouse_id || list[0].id;
          setSelectedWH(firstId);
          setForm((f) => ({ ...f, warehouse_id: firstId }));
        }
      } catch {
      } finally {
        setWhLoading(false);
      }
    })();
  }, []);

  const load = useCallback(async (warehouseId) => {
    if (!warehouseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getByWarehouse(warehouseId);
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.inventory ?? res.data?.items ?? res.data?.data ?? []);
      setItems(list);
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to add item"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWH) load(selectedWH);
  }, [selectedWH, load]);

  const handleAdd = async () => {
    if (!form.product_name || !form.warehouse_id) {
      setFormError("Product name and warehouse required");
      return;
    }
    if (!form.quantity || isNaN(Number(form.quantity))) {
      setFormError("Please enter a valid quantity");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await inventoryService.add({
        product_name: form.product_name,
        quantity: parseInt(form.quantity), // ✅ always an integer
        warehouse_id: parseInt(form.warehouse_id), // ✅ always an integer, not string
      });
      await load(selectedWH);
      setAddOpen(false);
      setForm((f) => ({
        product_name: "",
        sku: "",
        quantity: "",
        category: "",
        warehouse_id: f.warehouse_id,
      }));
    } catch (err) {
      setFormError(err?.response?.data?.detail || "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const inStock = items.filter(
    (i) => (i.status || "").toLowerCase().replace(/ /g, "_") === "in_stock",
  ).length;
  const lowStock = items.filter(
    (i) => (i.status || "").toLowerCase().replace(/ /g, "_") === "low_stock",
  ).length;
  const outStock = items.filter(
    (i) => (i.status || "").toLowerCase().replace(/ /g, "_") === "out_of_stock",
  ).length;

  if (whLoading) return <PageLoader label="Loading inventory…" />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Inventory Matrix</h1>
          <p className="section-sub">
            // stock levels · SKU tracking · per warehouse
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <PlusIcon className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Warehouse selector */}
      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">
          Warehouse
        </span>
        {warehouses.length === 0 ? (
          <span className="text-xs text-slate-500">
            No warehouses found — add one first
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {warehouses.map((w) => {
              const id = w.warehouse_id || w.id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedWH(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border
                    ${
                      selectedWH === id
                        ? "bg-brand-red/15 text-brand-red border-brand-red/30"
                        : "text-slate-500 border-dark-500 hover:border-dark-300 hover:text-slate-300"
                    }`}
                >
                  {id} · {w.name || "Unnamed"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <PageLoader label="Loading items…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(selectedWH)} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Total SKUs", items.length, "#60a5fa"],
              ["In Stock", inStock, "#4ade80"],
              ["Low Stock", lowStock, "#fbbf24"],
              ["Out of Stock", outStock, "#f87171"],
            ].map(([l, v, c]) => (
              <div key={l} className="card p-4">
                <p
                  className="font-bold leading-none mb-1"
                  style={{
                    fontFamily: "Syne,sans-serif",
                    fontSize: 32,
                    color: c,
                  }}
                >
                  {v}
                </p>
                <p className="text-xs text-slate-500">{l}</p>
              </div>
            ))}
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No inventory items"
              description="This warehouse has no inventory records yet."
            />
          ) : (
            <Table
              columns={COLS}
              data={items}
              filters={["In Stock", "Low Stock", "Out of Stock"]}
              title={`Inventory — WH-${selectedWH}`}
            />
          )}
        </>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Inventory Item"
      >
        <div className="space-y-4">
          {formError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {formError}
            </div>
          )}
          {[
            [
              "Product Name *",
              "product_name",
              "text",
              "e.g. Industrial Bearings",
            ],
            ["Quantity *", "quantity", "number", "e.g. 500"],
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
            <label className="label">Warehouse *</label>
            <select
              className="select"
              value={form.warehouse_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, warehouse_id: e.target.value }))
              }
            >
              {warehouses.map((w) => {
                const id = w.warehouse_id || w.id;
                return (
                  <option key={id} value={id}>
                    {id} · {w.name || "Unnamed"}
                  </option>
                );
              })}
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
              {saving ? "Adding…" : "Add Item"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
