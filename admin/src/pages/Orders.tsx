import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search } from "lucide-react";
import { api, download, errorMessage } from "../lib/api";
import type { Order } from "../types";
import { connectSocket, type OrderRealtimePayload } from "../lib/socket";
import { date, money, ORDER_STATUSES } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { Badge, EmptyState, ErrorState, Loading, PageHeader, Pagination } from "../components/ui";
import { Select } from "../components/Select";

export function Orders() {
  const { show } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageSize = 20;

  const queryString = () => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);
    return params.toString();
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ orders: Order[]; total: number }>(`/orders/admin?${queryString()}`);
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, status]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const socket = connectSocket();
    const handleUpdate = (payload: OrderRealtimePayload) => {
      const incoming = payload?.order;
      if (!incoming?.id) return;
      if (incoming.items) loadRef.current();
      setOrders((previous) => {
        const index = previous.findIndex((order) => order.id === incoming.id);
        if (status && incoming.status && incoming.status !== status) {
          return index === -1 ? previous : previous.filter((order) => order.id !== incoming.id);
        }
        if (index === -1) return previous;
        const next = [...previous];
        next[index] = { ...next[index], ...incoming };
        return next;
      });
    };
    const handleRequest = () => loadRef.current();
    socket.on("order:created", handleUpdate);
    socket.on("order:status", handleUpdate);
    socket.on("order:payment", handleUpdate);
    socket.on("order:updated", handleUpdate);
    socket.on("order:request", handleRequest);
    return () => {
      socket.off("order:created", handleUpdate);
      socket.off("order:status", handleUpdate);
      socket.off("order:payment", handleUpdate);
      socket.off("order:updated", handleUpdate);
      socket.off("order:request", handleRequest);
    };
  }, [status]);

  const exportOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      await download(`/admin/export/orders?${params.toString()}`, "orders.csv");
      show("Orders exported");
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle="Track, fulfil and update customer orders." action={<button onClick={exportOrders} className="btn-secondary"><Download className="h-4 w-4" /> Export CSV</button>} />

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <form onSubmit={(event) => { event.preventDefault(); setPage(1); load(); }} className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Order number, customer, phone..." className="input pl-10" />
        </form>
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="input">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="input" />
        <div className="flex gap-2">
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="input min-w-0 flex-1" />
          <button onClick={() => { setPage(1); load(); }} className="btn-primary shrink-0">Filter</button>
        </div>
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : orders.length === 0 ? (
        <EmptyState title="No orders found" text="Try a different status or date range." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link to={`/orders/${order.id}`} className="font-semibold text-slate-800 hover:text-leaf-700">{order.orderNumber}</Link>
                      <p className="text-xs text-slate-400">{date(order.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-700">{order.user?.name || order.shippingName}</p>
                      <p className="text-xs text-slate-400">{order.shippingPhone}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{order.items.length}</td>
                    <td className="px-5 py-3"><Badge status={order.status} /></td>
                    <td className="px-5 py-3"><Badge status={order.paymentStatus} /></td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{money(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-4"><Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} /></div>
        </div>
      )}
    </div>
  );
}
