import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, Plus, Search, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Product } from "../types";
import { money } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../components/ConfirmModal";
import { Select } from "../components/Select";
import { Badge, EmptyState, ErrorState, Loading, Modal, PageHeader, Pagination } from "../components/ui";

export function Products() {
  const { show } = useToast();
  const { confirm, modal } = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [published, setPublished] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({ quantity: "", type: "RESTOCK", note: "" });
  const [busy, setBusy] = useState(false);
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ all: "1", page: String(page), pageSize: String(pageSize) });
      if (q) params.set("q", q);
      if (published) params.set("published", published);
      const data = await api<{ products: Product[]; total: number }>(`/products?${params.toString()}`);
      setProducts(data.products);
      setTotal(data.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, published]);

  const togglePublished = async (product: Product) => {
    try {
      await api(`/products/${product.id}/publish`, { method: "PATCH", body: { published: !product.published } });
      show(product.published ? "Product unpublished" : "Product published");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const remove = async (product: Product) => {
    if (!(await confirm({ title: "Delete product", message: `Delete ${product.name}? Products with order history will be unpublished instead.` }))) return;
    try {
      const result = await api<{ unpublished?: boolean }>(`/products/${product.id}`, { method: "DELETE" });
      show(result?.unpublished ? "Product has order history and was unpublished" : "Product deleted");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const updateStock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stockProduct) return;
    setBusy(true);
    try {
      await api(`/products/${stockProduct.id}/stock`, {
        method: "PATCH",
        body: { quantity: Number(stockForm.quantity), type: stockForm.type, note: stockForm.note || undefined },
      });
      show("Stock updated");
      setStockProduct(null);
      setStockForm({ quantity: "", type: "RESTOCK", note: "" });
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your catalogue, pricing and stock."
        action={<Link to="/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>}
      />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <form onSubmit={(event) => { event.preventDefault(); setPage(1); load(); }} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name, SKU..." className="input pl-10" />
        </form>
        <Select value={published} onChange={(event) => { setPublished(event.target.value); setPage(1); }} className="input sm:w-44">
          <option value="">All statuses</option>
          <option value="1">Published</option>
          <option value="0">Unpublished</option>
        </Select>
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : products.length === 0 ? (
        <EmptyState title="No products found" text="Add your first product or adjust the filters." action={<Link to="/products/new" className="btn-primary">Add product</Link>} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt="" className="h-11 w-11 rounded-lg bg-slate-100 object-cover" />
                        <div>
                          <Link to={`/products/${product.id}/edit`} className="font-semibold text-slate-800 hover:text-leaf-700">{product.name}</Link>
                          <p className="text-xs text-slate-400">{product.sku} · {product.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{product.category?.name || "—"}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{money(product.salePrice || product.price)}</p>
                      {product.salePrice && <p className="text-xs text-slate-400 line-through">{money(product.price)}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${product.stock <= product.lowStockThreshold ? "text-amber-600" : "text-slate-700"}`}>{product.stock}</span>
                      <span className="text-xs text-slate-400"> {product.unit}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${product.published ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                        {product.published ? "Published" : "Draft"}
                      </span>
                      {product.featured && <span className="ml-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">Featured</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setStockProduct(product); setStockForm({ quantity: "", type: "RESTOCK", note: "" }); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-leaf-700" title="Adjust stock"><Boxes className="h-4 w-4" /></button>
                        <Link to={`/products/${product.id}/edit`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-leaf-700 hover:bg-leaf-50">Edit</Link>
                        <button onClick={() => togglePublished(product)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">{product.published ? "Unpublish" : "Publish"}</button>
                        <button onClick={() => remove(product)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-4"><Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} /></div>
        </div>
      )}

      {stockProduct && (
        <Modal title={`Adjust stock · ${stockProduct.name}`} onClose={() => setStockProduct(null)}>
          <form onSubmit={updateStock} className="space-y-4">
            <p className="text-sm text-slate-500">Current stock: <span className="font-semibold text-slate-800">{stockProduct.stock} {stockProduct.unit}</span></p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Movement type</label>
              <Select value={stockForm.type} onChange={(event) => setStockForm({ ...stockForm, type: event.target.value })} className="input">
                <option value="RESTOCK">Restock (add)</option>
                <option value="ADJUSTMENT">Adjustment (+ / -)</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Quantity change</label>
              <input type="number" required value={stockForm.quantity} onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })} className="input" placeholder="e.g. 25 or -3" />
              <p className="mt-1 text-xs text-slate-400">Use a negative number to reduce stock.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Note</label>
              <input value={stockForm.note} onChange={(event) => setStockForm({ ...stockForm, note: event.target.value })} className="input" placeholder="Optional reason" />
            </div>
            <div className="flex gap-3">
              <button disabled={busy} className="btn-primary flex-1">{busy ? "Updating..." : "Update stock"}</button>
              <button type="button" onClick={() => setStockProduct(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    {modal}
</div>
  );
}
