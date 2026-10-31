import { useEffect, useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import { api, download, errorMessage } from "../lib/api";
import type { Report } from "../types";
import { money, todayInput } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { EmptyState, ErrorState, Loading, PageHeader, StatCard } from "../components/ui";

export function Reports() {
  const { show } = useToast();
  const [from, setFrom] = useState(todayInput(-29));
  const [to, setTo] = useState(todayInput());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ report: Report }>(`/admin/reports?from=${from}&to=${to}`);
      setReport(data.report);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportSales = async () => {
    try {
      await download(`/admin/export/sales?from=${from}&to=${to}`, `sales-${from}-${to}.csv`);
      show("Sales report exported");
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const maxDaily = Math.max(1, ...(report?.daily.map((day) => Number(day.revenue)) || [1]));

  return (
    <div>
      <PageHeader title="Reports" subtitle="Understand revenue, order volume and best sellers." action={<button onClick={exportSales} className="btn-secondary"><Download className="h-4 w-4" /> Export sales</button>} />

      <form onSubmit={(event) => { event.preventDefault(); load(); }} className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-600">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="input mt-1.5" /></label>
        <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-600">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="input mt-1.5" /></label>
        <button className="btn-primary">Run report</button>
      </form>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : !report ? (
        <EmptyState title="No report data" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={money(report.revenue)} icon={<TrendingUp className="h-5 w-5" />} />
            <StatCard label="Valid orders" value={report.validOrderCount} hint={`${report.orderCount} orders placed`} tone="blue" />
            <StatCard label="Average order" value={money(report.averageOrderValue)} tone="amber" />
            <StatCard label="Products sold" value={report.products.reduce((sum, product) => sum + product.quantity, 0)} tone="rose" />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Daily revenue</h2>
            {report.daily.length === 0 ? <p className="mt-3 text-sm text-slate-400">No sales in this period.</p> : (
              <div className="mt-5 flex h-48 items-end gap-2 overflow-x-auto">
                {report.daily.map((day) => (
                  <div key={day.date} className="flex min-w-[42px] flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-500">{money(day.revenue)}</span>
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t-md bg-leaf-500 transition-all hover:bg-leaf-600" style={{ height: `${Math.max(4, (Number(day.revenue) / maxDaily) * 100)}%` }} title={`${day.date}: ${money(day.revenue)}`} />
                    </div>
                    <span className="text-[10px] text-slate-400">{day.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="font-bold text-slate-900">Top products</h2>
              <div className="mt-4 divide-y divide-slate-100">
                {report.products.slice(0, 10).map((product, index) => (
                  <div key={product.name} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span>
                    <span className="flex-1 font-medium text-slate-700">{product.name}</span>
                    <span className="text-slate-500">{product.quantity} sold</span>
                    <span className="w-24 text-right font-semibold text-slate-800">{money(product.revenue)}</span>
                  </div>
                ))}
                {report.products.length === 0 && <p className="py-4 text-sm text-slate-400">No products sold.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="font-bold text-slate-900">Recent orders</h2>
              <div className="mt-4 divide-y divide-slate-100">
                {report.orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400">{order.user?.name}</p>
                    </div>
                    <span className="text-xs text-slate-500">{order.status}</span>
                    <span className="font-semibold text-slate-800">{money(order.total)}</span>
                  </div>
                ))}
                {report.orders.length === 0 && <p className="py-4 text-sm text-slate-400">No orders in this period.</p>}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
