import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, PackageCheck, RotateCcw, XCircle } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Order, OrderStatus } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { dateTime, money, statusLabel } from "../lib/format";
import { StatusBadge } from "../components/StatusBadge";
import { ErrorState, Loading } from "../components/Loading";
import { PageHeader } from "../components/PageHeader";

const timeline: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export function OrderDetail() {
  const { id } = useParams();
  const { t, pick, lang } = useLanguage();
  const { show } = useToast();
  const [params] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestType, setRequestType] = useState<"RETURN" | "REFUND" | "CANCEL" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<{ order: Order }>(`/orders/${id}`);
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

  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order || !requestType) return;
    setBusy(true);
    try {
      if (requestType === "CANCEL") {
        await api(`/orders/${order.id}/cancel`, { method: "POST", body: { note: reason || undefined } });
        show(lang === "bn" ? "অর্ডার বাতিল হয়েছে" : "Order cancelled");
      } else {
        await api(`/orders/${order.id}/request`, { method: "POST", body: { type: requestType, reason } });
        show(lang === "bn" ? "অনুরোধ জমা হয়েছে" : "Request submitted");
      }
      setRequestType(null);
      setReason("");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !order) return <ErrorState message={error || t("error.generic")} onRetry={load} />;

  const currentIndex = timeline.indexOf(order.status);
  const canCancel = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);
  const canRequest = order.status === "DELIVERED";
  const placed = params.get("placed") === "1";

  return (
    <div>
      {placed && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-leaf-200 bg-leaf-50 p-4 text-sm text-leaf-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{lang === "bn" ? "আপনার অর্ডার সফলভাবে জমা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।" : "Your order was placed successfully. We will contact you shortly to confirm."}</p>
        </div>
      )}
      <Link to="/account/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-leaf-700">
        <ArrowLeft className="h-4 w-4" /> {t("account.orders")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-stone-900">{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-stone-500">{dateTime(order.createdAt, lang)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {!["CANCELLED", "RETURNED"].includes(order.status) && (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between gap-2">
            {timeline.map((status, index) => (
              <div key={status} className="flex flex-1 flex-col items-center text-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${index <= currentIndex ? "border-leaf-600 bg-leaf-600 text-white" : "border-stone-200 bg-white text-stone-300"}`}>
                  {index < currentIndex ? <PackageCheck className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                </div>
                <p className={`mt-2 text-[11px] font-medium ${index <= currentIndex ? "text-leaf-700" : "text-stone-400"}`}>{statusLabel(status, lang)}</p>
                {index < timeline.length - 1 && <div className={`absolute hidden`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.status === "CANCELLED" && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="h-5 w-5" /> {lang === "bn" ? "এই অর্ডারটি বাতিল করা হয়েছে।" : "This order has been cancelled."}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-semibold text-stone-900">{lang === "bn" ? "পণ্যসমূহ" : "Items"}</h3>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.imageUrl || ""} alt="" className="h-16 w-16 rounded-xl bg-cream-100 object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-stone-800">{lang === "bn" && item.productNameBn ? item.productNameBn : item.productName}</p>
                    <p className="text-xs text-stone-500">{item.quantity} × {money(item.salePrice || item.price)} · {item.unit}</p>
                  </div>
                  <p className="text-sm font-semibold">{money(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="flex items-center gap-2 font-semibold text-stone-900"><MapPin className="h-4 w-4 text-leaf-600" /> {t("checkout.address")}</h3>
            <div className="mt-3 text-sm text-stone-600">
              <p className="font-medium text-stone-800">{order.shippingName} · {order.shippingPhone}</p>
              <p>{order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}, {order.shippingDivision}</p>
            </div>
            {order.note && <p className="mt-3 rounded-xl bg-cream-100 p-3 text-xs text-stone-600">{t("common.note")}: {order.note}</p>}
          </section>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="font-semibold text-stone-900">{lang === "bn" ? "অর্ডার ইতিহাস" : "Order history"}</h3>
              <div className="mt-4 space-y-3">
                {order.statusHistory.map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-leaf-500" />
                    <div>
                      <p className="font-medium text-stone-700">{statusLabel(entry.status, lang)}</p>
                      <p className="text-xs text-stone-400">{dateTime(entry.createdAt, lang)} {entry.note ? `· ${entry.note}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {order.requests && order.requests.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="font-semibold text-stone-900">{lang === "bn" ? "অনুরোধসমূহ" : "Requests"}</h3>
              <div className="mt-3 space-y-3">
                {order.requests.map((request) => (
                  <div key={request.id} className="rounded-xl bg-cream-100 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{request.type}</span>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{request.reason}</p>
                    {request.adminNote && <p className="mt-1 text-xs text-stone-600">{lang === "bn" ? "প্রশাসক নোট" : "Admin note"}: {request.adminNote}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-display text-xl text-stone-900">{t("cart.summary")}</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">{t("common.subtotal")}</dt><dd>{money(order.subtotal)}</dd></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-leaf-700"><dt>{t("common.discount")}</dt><dd>-{money(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-stone-500">{t("common.delivery")}</dt><dd>{money(order.deliveryFee)}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold"><dt>{t("common.total")}</dt><dd>{money(order.total)}</dd></div>
            </dl>
            <div className="mt-4 border-t border-stone-200 pt-3 text-xs text-stone-500">
              <p>{lang === "bn" ? "পেমেন্ট" : "Payment"}: <span className="font-medium text-stone-700">{order.paymentMethod}</span></p>
              <p className="mt-1">{t("common.status")}: <StatusBadge status={order.paymentStatus} /></p>
            </div>
          </div>
          {canCancel && (
            <button onClick={() => setRequestType("CANCEL")} className="w-full rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
              {t("account.cancelOrder")}
            </button>
          )}
          {canRequest && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setRequestType("RETURN")} className="rounded-full border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-cream-100">
                <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> {t("account.requestReturn")}
              </button>
              <button onClick={() => setRequestType("REFUND")} className="rounded-full border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-cream-100">
                {t("account.requestRefund")}
              </button>
            </div>
          )}
        </aside>
      </div>

      {requestType && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-stone-900/40" onClick={() => setRequestType(null)} aria-label="Close" />
          <form onSubmit={submitAction} className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-2xl text-stone-900">
              {requestType === "CANCEL" ? t("account.cancelOrder") : requestType === "RETURN" ? t("account.requestReturn") : t("account.requestRefund")}
            </h3>
            <p className="mt-1 text-xs text-stone-500">{lang === "bn" ? "অনুগ্রহ করে কারণ লিখুন।" : "Please tell us the reason."}</p>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={5} rows={4} className="input mt-4" placeholder={lang === "bn" ? "কারণ..." : "Reason..."} />
            <div className="mt-4 flex gap-3">
              <button disabled={busy} className="btn-primary flex-1">{busy ? t("common.loading") : t("account.submitRequest")}</button>
              <button type="button" onClick={() => setRequestType(null)} className="btn-secondary">{t("common.cancel")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
