import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, History, PackagePlus } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { InventoryMovement } from "../types";
import { dateTime } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { EmptyState, ErrorState, Field, Loading, Modal, PageHeader, StatCard } from "../components/ui";
import { Select } from "../components/Select";

interface StockProduct {
  id: string;
  name: string;
  nameBn: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  published: boolean;
}

export function Inventory() {
  const { show } = useToast();
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjusting, setAdjusting] = useState<StockProduct | null>(null);
  const [movementProduct, setMovementProduct] = useState<StockProduct | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<"RESTOCK" | "ADJUSTMENT">("RESTOCK");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ products: StockProduct[] }>("/admin/low-stock");
      setProducts(data.products);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdjust = (product: StockProduct) => {
    setAdjusting(product);
    setQuantity("");
    setType("RESTOCK");
    setNote("");
  };

  const openMovements = async (product: StockProduct) => {
    setMovementProduct(product);
    setMovementsLoading(true);
    try {
      const data = await api<{ movements: InventoryMovement[] }>(`/admin/inventory/${product.id}`);
      setMovements(data.movements);
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setMovementsLoading(false);
    }
  };

  const adjust = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adjusting) return;
    setBusy(true);
    try {
      const amount = Number(quantity);
      const delta = type === "RESTOCK" ? Math.abs(amount) : amount;
      await api(`/products/${adjusting.id}/stock`, { method: "PATCH", body: { quantity: delta, note: note || undefined, type } });
      show("Stock updated");
      setAdjusting(null);
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const outOfStock = products.filter((product) => product.stock === 0).length;
  const lowStock = products.filter((product) => product.stock > 0).length;

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Keep an eye on stock and record adjustments." action={<Link to="/products" className="btn-secondary">Manage products</Link>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Needs attention" value={products.length} icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
        <StatCard label="Out of stock" value={outOfStock} icon={<AlertTriangle className="h-5 w-5" />} tone="rose" />
        <StatCard label="Low stock" value={lowStock} icon={<PackagePlus className="h-5 w-5" />} tone="blue" />
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : products.length === 0 ? (
        <EmptyState title="Stock levels look healthy" text="Products at or below their low-stock threshold will appear here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">SKU</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Threshold</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.nameBn} · {product.unit}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className={`px-5 py-3 text-lg font-bold ${product.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>{product.stock}</td>
                    <td className="px-5 py-3 text-slate-600">{product.lowStockThreshold}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{product.stock === 0 ? "Out of stock" : "Low stock"}</span>
                      {!product.published && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">Unpublished</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openAdjust(product)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-leaf-700 hover:bg-leaf-50">Adjust</button>
                        <button onClick={() => openMovements(product)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Stock history"><History className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adjusting && (
        <Modal title="Adjust stock" onClose={() => setAdjusting(null)}>
          <form onSubmit={adjust} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-800">{adjusting.name}</p>
              <p className="text-sm text-slate-500">Current stock: <span className="font-bold text-slate-800">{adjusting.stock}</span> {adjusting.unit}</p>
            </div>
            <Field label="Reason">
              <Select value={type} onChange={(event) => setType(event.target.value as "RESTOCK" | "ADJUSTMENT")} className="input">
                <option value="RESTOCK">Restock (add stock)</option>
                <option value="ADJUSTMENT">Adjustment (add or remove)</option>
              </Select>
            </Field>
            <Field label="Quantity" hint={type === "RESTOCK" ? "Units to add" : "Use a negative number to remove stock"}>
              <input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} required className="input" />
            </Field>
            <Field label="Note (optional)"><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="input" /></Field>
            <div className="flex gap-3">
              <button disabled={busy} className="btn-primary flex-1">{busy ? "Updating..." : "Update stock"}</button>
              <button type="button" onClick={() => setAdjusting(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {movementProduct && (
        <Modal title={`Stock history · ${movementProduct.name}`} onClose={() => setMovementProduct(null)} wide>
          {movementsLoading ? <Loading /> : movements.length === 0 ? <p className="text-sm text-slate-400">No movements recorded.</p> : (
            <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100">
              {movements.map((movement) => (
                <div key={movement.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{movement.type}</p>
                    <p className="text-xs text-slate-400">{dateTime(movement.createdAt)} {movement.referenceType ? `· ${movement.referenceType}` : ""} {movement.editor?.name ? `· ${movement.editor.name}` : ""}</p>
                    {movement.note && <p className="text-xs text-slate-500">{movement.note}</p>}
                  </div>
                  <span className={`font-bold ${movement.quantity >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
