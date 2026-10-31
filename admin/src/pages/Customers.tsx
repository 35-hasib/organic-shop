import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, UserCheck, UserX } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Customer } from "../types";
import { date, money } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { Badge, EmptyState, ErrorState, Loading, Modal, PageHeader, Pagination } from "../components/ui";

export function Customers() {
  const { show } = useToast();
  const [params, setParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Customer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q) query.set("q", q);
      const data = await api<{ customers: Customer[]; total: number }>(`/admin/customers?${query.toString()}`);
      setCustomers(data.customers);
      setTotal(data.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const openCustomer = async (id: string) => {
    setDetailLoading(true);
    setDetail({ id } as Customer);
    try {
      const data = await api<{ customer: Customer }>(`/admin/customers/${id}`);
      setDetail(data.customer);
    } catch (err) {
      show(errorMessage(err), "error");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const open = params.get("open");
    if (open) {
      openCustomer(open);
      setParams({}, { replace: true });
    }
  }, []);

  const toggleActive = async (customer: Customer) => {
    try {
      await api(`/admin/customers/${customer.id}`, { method: "PATCH", body: { active: !customer.active } });
      show(customer.active ? "Customer deactivated" : "Customer activated");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Customers" subtitle="See who shops with you and manage account access." />
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); load(); }} className="mb-4 flex gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name, email or phone..." className="input pl-10" />
        </div>
        <button className="btn-primary">Search</button>
      </form>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : customers.length === 0 ? (
        <EmptyState title="No customers found" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Total spent</th>
                  <th className="px-5 py-3 font-semibold">Last order</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{customer.name}</p>
                      <p className="text-xs text-slate-400">{customer.email || customer.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{customer._count?.orders || 0}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{money(customer.totalSpent)}</td>
                    <td className="px-5 py-3 text-slate-600">{date(customer.lastOrderAt)}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{customer.active ? "Active" : "Disabled"}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openCustomer(customer.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-leaf-700 hover:bg-leaf-50">View</button>
                        <button onClick={() => toggleActive(customer)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title={customer.active ? "Deactivate" : "Activate"}>
                          {customer.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
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

      {detail && (
        <Modal title="Customer details" onClose={() => setDetail(null)} wide>
          {detailLoading ? <Loading /> : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                  <p className="mt-2 font-semibold text-slate-800">{detail.name}</p>
                  <p className="text-sm text-slate-600">{detail.email || "—"}</p>
                  <p className="text-sm text-slate-600">{detail.phone || "—"}</p>
                  <p className="mt-1 text-xs text-slate-400">Joined {date(detail.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</p>
                  <p className="mt-2 text-sm text-slate-600">{detail.orders?.length || 0} orders</p>
                  <p className="text-sm text-slate-600">Status: {detail.active ? "Active" : "Disabled"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">Addresses</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {detail.addresses?.map((address) => (
                    <div key={address.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{address.label} · {address.phone}</p>
                      <p>{address.addressLine}, {address.area}, {address.district}</p>
                    </div>
                  ))}
                  {(!detail.addresses || detail.addresses.length === 0) && <p className="text-sm text-slate-400">No saved addresses.</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">Recent orders</h3>
                <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {detail.orders?.slice(0, 8).map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <Link to={`/orders/${order.id}`} className="font-semibold text-slate-800 hover:text-leaf-700">{order.orderNumber}</Link>
                      <Badge status={order.status} />
                      <span className="text-slate-500">{date(order.createdAt)}</span>
                      <span className="font-semibold">{money(order.total)}</span>
                    </div>
                  ))}
                  {(!detail.orders || detail.orders.length === 0) && <p className="px-4 py-4 text-sm text-slate-400">No orders yet.</p>}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
