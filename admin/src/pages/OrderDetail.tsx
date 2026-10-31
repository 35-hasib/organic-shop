import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Phone, User as UserIcon } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Order, OrderRequest } from "../types";
import { dateTime, money, NEXT_STATUSES, ORDER_STATUSES, statusLabel } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { Badge, ErrorState, Loading, Modal, PageHeader } from "../components/ui";
import { Select } from "../components/Select";

export function OrderDetail() {
  const { id } = useParams();
  const { show } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [targetStatus, setTargetStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [requestAction, setRequestAction] = useState<{ request: OrderRequest; status: "APPROVED" | "REJECTED" } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api<{ order: Order }>(`/orders/admin/${id}`);
      setOrder(data.order);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order || !targetStatus) return;
    setBusy(true);
    try {
      await api(`/orders/admin/${order.id}/status`, { method: "PATCH", body: { status: targetStatus, note: statusNote || null } });
      show(`Order updated to ${statusLabel(targetStatus)}`);
      setTargetStatus("");
      setStatusNote("");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const updatePayment = async (paymentStatus: string) => {
    if (!order) return;
    try {
      await api(`/orders/admin/${order.id}/payment`, { method: "PATCH", body: { paymentStatus } });
      show("Payment status updated");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const resolveRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestAction) return;
    setBusy(true);
    try {
      await api(`/orders/admin/requests/${requestAction.request.id}`, {
        method: "PATCH",
        body: { status: requestAction.status, adminNote: adminNote || null },
      });
      show(`Request ${requestAction.status.toLowerCase()}`);
      setRequestAction(null);
      setAdminNote("");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !order) return <ErrorState message={error || "Order not found"} />;

  return (
    <div>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-leaf-700"><ArrowLeft className="h-4 w-4" /> Orders</Link>
      <PageHeader
        title={order.orderNumber}
        subtitle={`Placed ${dateTime(order.createdAt)}`}
        action={<div className="flex items-center gap-2"><Badge status={order.status} /><Badge status={order.paymentStatus} /></div>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Items</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <img src={item.imageUrl || ""} alt="" className="h-14 w-14 rounded-lg bg-slate-100 object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.productNameBn}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.quantity} × {money(item.salePrice || item.price)} · {item.unit}</p>
                  </div>
                  <p className="font-semibold text-slate-800">{money(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>-{money(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd>{money(order.deliveryFee)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            </dl>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><UserIcon className="h-4 w-4 text-leaf-600" /> Customer</h2>
              <p className="mt-3 font-medium text-slate-800">{order.user?.name || order.shippingName}</p>
              {order.user?.email && <p className="text-sm text-slate-500">{order.user.email}</p>}
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Phone className="h-3.5 w-3.5" /> {order.shippingPhone}</p>
              {order.user?.id && <Link to={`/customers?open=${order.user.id}`} className="mt-2 inline-block text-xs font-semibold text-leaf-700">View customer</Link>}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-bold text-slate-900"><MapPin className="h-4 w-4 text-leaf-600" /> Delivery address</h2>
              <p className="mt-3 text-sm font-medium text-slate-800">{order.shippingName}</p>
              <p className="mt-1 text-sm text-slate-600">{order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}, {order.shippingDivision}</p>
              {order.shippingPostalCode && <p className="text-xs text-slate-500">Postal code: {order.shippingPostalCode}</p>}
              {order.note && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Note: {order.note}</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Timeline</h2>
            <div className="mt-4 space-y-4">
              {order.statusHistory?.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700"><CheckCircle2 className="h-3.5 w-3.5" /></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{statusLabel(entry.status)}</p>
                    <p className="text-xs text-slate-400">{dateTime(entry.createdAt)} {entry.editor?.name ? `· ${entry.editor.name}` : ""} {entry.note ? `· ${entry.note}` : ""}</p>
                  </div>
                </div>
              ))}
              {(!order.statusHistory || order.statusHistory.length === 0) && <p className="text-sm text-slate-400">No status history.</p>}
            </div>
          </section>

          {order.requests && order.requests.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="font-bold text-slate-900">Return / refund requests</h2>
              <div className="mt-4 space-y-3">
                {order.requests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">{request.type}</span>
                      <Badge status={request.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{request.reason}</p>
                    <p className="mt-1 text-xs text-slate-400">{dateTime(request.createdAt)}</p>
                    {request.adminNote && <p className="mt-2 text-xs text-slate-500">Admin note: {request.adminNote}</p>}
                    {request.status === "PENDING" && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => setRequestAction({ request, status: "APPROVED" })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Approve</button>
                        <button onClick={() => setRequestAction({ request, status: "REJECTED" })} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Update status</h2>
            <div className="mt-4 grid gap-2">
              {(NEXT_STATUSES[order.status] || []).map((status) => (
                <button key={status} onClick={() => setTargetStatus(status)} className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold ${status === "CANCELLED" || status === "RETURNED" ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                  Mark as {statusLabel(status)}
                </button>
              ))}
              {(NEXT_STATUSES[order.status] || []).length === 0 && <p className="text-sm text-slate-400">No further status changes available.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Payment</h2>
            <Select value={order.paymentStatus} onChange={(event) => updatePayment(event.target.value)} className="input mt-3">
              {["UNPAID", "PAID", "REFUNDED"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </Select>
            <p className="mt-2 text-xs text-slate-400">Method: {order.paymentMethod}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card text-sm text-slate-600">
            <h2 className="font-bold text-slate-900">Dates</h2>
            <p className="mt-3">Placed: {dateTime(order.createdAt)}</p>
            <p>Delivered: {dateTime(order.deliveredAt)}</p>
            <p>Cancelled: {dateTime(order.cancelledAt)}</p>
          </section>
        </aside>
      </div>

      {targetStatus && (
        <Modal title={`Mark order as ${statusLabel(targetStatus)}`} onClose={() => setTargetStatus("")}>
          <form onSubmit={updateStatus} className="space-y-4">
            <p className="text-sm text-slate-500">Current status: <span className="font-semibold text-slate-800">{statusLabel(order.status)}</span></p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Note (optional)</label>
              <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} rows={3} className="input" placeholder="Internal note about this change" />
            </div>
            <div className="flex gap-3">
              <button disabled={busy} className="btn-primary flex-1">{busy ? "Updating..." : "Confirm update"}</button>
              <button type="button" onClick={() => setTargetStatus("")} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {requestAction && (
        <Modal title={`${requestAction.status === "APPROVED" ? "Approve" : "Reject"} ${requestAction.request.type.toLowerCase()} request`} onClose={() => setRequestAction(null)}>
          <form onSubmit={resolveRequest} className="space-y-4">
            <p className="text-sm text-slate-600">{requestAction.request.reason}</p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Admin note (optional)</label>
              <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} rows={3} className="input" />
            </div>
            <div className="flex gap-3">
              <button disabled={busy} className="btn-primary flex-1">{busy ? "Saving..." : requestAction.status === "APPROVED" ? "Approve request" : "Reject request"}</button>
              <button type="button" onClick={() => setRequestAction(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
