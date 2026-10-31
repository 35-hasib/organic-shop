import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Stats } from "../types";
import { date, money, statusLabel } from "../lib/format";
import { Badge, ErrorState, Loading, PageHeader, StatCard } from "../components/ui";

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lowStock, setLowStock] = useState<{ id: string; name: string; stock: number; unit: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ stats: Stats }>("/admin/stats"),
      api<{ products: { id: string; name: string; stock: number; unit: string }[] }>("/admin/low-stock"),
    ])
      .then(([statsData, stockData]) => {
        setStats(statsData.stats);
        setLowStock(stockData.products.slice(0, 5));
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error || !stats) return <ErrorState message={error || "Unable to load dashboard"} />;

  const maxRevenue = Math.max(...stats.dailySales.map((row) => Number(row.revenue)), 1);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A snapshot of your store for the last 30 days."
        action={<Link to="/reports" className="btn-secondary">View reports <ArrowUpRight className="h-4 w-4" /></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Delivered revenue" value={money(stats.revenue)} hint={`Avg order ${money(stats.averageOrderValue)}`} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Orders" value={stats.orders} hint={`${stats.pendingOrders} pending`} icon={<ShoppingCart className="h-4 w-4" />} tone="amber" />
        <StatCard label="Customers" value={stats.customers} hint="Registered customers" icon={<Users className="h-4 w-4" />} tone="blue" />
        <StatCard label="Products" value={stats.products} hint={`${stats.lowStock} low stock`} icon={<Package className="h-4 w-4" />} tone={stats.lowStock > 0 ? "rose" : "leaf"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Revenue trend</h2>
              <p className="text-xs text-slate-500">Delivered orders, last 30 days</p>
            </div>
            <span className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-semibold text-leaf-700">{money(stats.revenue)}</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1.5">
            {stats.dailySales.length === 0 ? (
              <p className="w-full text-center text-sm text-slate-400">No delivered orders in this period.</p>
            ) : (
              stats.dailySales.map((row) => (
                <div key={row.date} className="group relative flex flex-1 flex-col items-center justify-end" title={`${row.date}: ${money(row.revenue)}`}>
                  <div className="w-full rounded-t bg-leaf-500 transition group-hover:bg-leaf-700" style={{ height: `${Math.max(6, (Number(row.revenue) / maxRevenue) * 100)}%` }} />
                </div>
              ))
            )}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            <span>{stats.dailySales[0]?.date || ""}</span>
            <span>{stats.dailySales[stats.dailySales.length - 1]?.date || ""}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-bold text-slate-900">Order status</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <Link key={status} to={`/orders?status=${status}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <Badge status={status} />
                <span className="text-sm font-semibold text-slate-700">{count}</span>
              </Link>
            ))}
            {Object.keys(stats.statusCounts).length === 0 && <p className="text-sm text-slate-400">No orders in this period.</p>}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Recent orders</h2>
            <Link to="/orders" className="text-xs font-semibold text-leaf-700 hover:text-leaf-900">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link to={`/orders/${order.id}`} className="font-semibold text-slate-800 hover:text-leaf-700">{order.orderNumber}</Link>
                      <p className="text-xs text-slate-400">{date(order.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{order.user?.name || order.shippingName}</td>
                    <td className="px-5 py-3"><Badge status={order.status} /></td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{money(order.total)}</td>
                  </tr>
                ))}
                {stats.recentOrders.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock</h2>
            <Link to="/inventory" className="text-xs font-semibold text-leaf-700 hover:text-leaf-900">Manage</Link>
          </div>
          <div className="mt-4 space-y-3">
            {lowStock.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg bg-amber-50/60 px-3 py-2">
                <p className="line-clamp-1 text-sm font-medium text-slate-700">{product.name}</p>
                <span className="shrink-0 text-xs font-bold text-amber-700">{product.stock} {product.unit}</span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-slate-400">All products are well stocked.</p>}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="font-bold text-slate-900">Top products</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.topProducts.slice(0, 8).map((product, index) => (
            <div key={`${product.name}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
                <span className="text-xs font-semibold text-leaf-700">{money(product.revenue)}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-700">{product.name}</p>
              <p className="text-xs text-slate-500">{product.quantity} sold</p>
            </div>
          ))}
          {stats.topProducts.length === 0 && <p className="text-sm text-slate-400">No sales data yet.</p>}
        </div>
      </section>
    </div>
  );
}
