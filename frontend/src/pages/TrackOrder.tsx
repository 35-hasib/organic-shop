import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, PackageCheck, PackageSearch, Search, XCircle } from "lucide-react";
import { ApiError, api, errorMessage } from "../lib/api";
import type { Order, OrderStatus } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { dateTime, money, statusLabel } from "../lib/format";
import { StatusBadge } from "../components/StatusBadge";
import { PageHeader } from "../components/PageHeader";
import { Loading } from "../components/Loading";

const timeline: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export function TrackOrder() {
  const { t, lang } = useLanguage();
  const [params, setParams] = useSearchParams();
  const query = params.get("order")?.trim() || "";
  const [input, setInput] = useState(query);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setOrder(null);
      setError("");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    api<{ order: Order }>(`/orders/track?orderNumber=${encodeURIComponent(query)}`, { auth: false })
      .then((data) => {
        if (active) setOrder(data.order);
      })
      .catch((err) => {
        if (!active) return;
        setOrder(null);
        setError(err instanceof ApiError && err.status === 404 ? t("track.notFound") : errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = input.trim().toUpperCase();
    if (!value) return;
    setParams({ order: value }, { replace: true });
  };

  const reset = () => {
    setInput("");
    setOrder(null);
    setError("");
    setParams({}, { replace: true });
  };

  const currentIndex = order ? timeline.indexOf(order.status) : -1;

  return (
    <div>
      <PageHeader title={t("track.title")} subtitle={t("track.subtitle")} />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <form onSubmit={submit} className="rounded-2xl border border-stone-200 bg-white p-5">
          <label className="label" htmlFor="order-number">{t("track.orderNumber")}</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="order-number"
              value={input}
              onChange={(event) => setInput(event.target.value.toUpperCase())}
              className="input"
              placeholder={t("track.placeholder")}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary shrink-0">
              <Search className="h-4 w-4" /> {t("track.submit")}
            </button>
          </div>
          <p className="mt-3 text-xs text-stone-500">{t("track.help")}</p>
        </form>

        {loading && <Loading />}

        {!loading && error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" /> <p>{error}</p>
          </div>
        )}

        {!loading && !error && !order && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
              <PackageSearch className="h-7 w-7 text-leaf-600" />
            </div>
            <p className="max-w-md text-sm text-stone-500">{t("track.empty")}</p>
          </div>
        )}

        {!loading && order && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{t("track.orderNumber")}</p>
                  <p className="mt-1 font-display text-3xl text-stone-900">{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-stone-500">{dateTime(order.createdAt, lang)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {!["CANCELLED", "RETURNED"].includes(order.status) && (
                <div className="mt-6 border-t border-stone-200 pt-6">
                  <div className="flex items-center justify-between gap-2">
                    {timeline.map((status, index) => (
                      <div key={status} className="flex flex-1 flex-col items-center text-center">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${index <= currentIndex ? "border-leaf-600 bg-leaf-600 text-white" : "border-stone-200 bg-white text-stone-300"}`}>
                          {index < currentIndex ? <PackageCheck className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                        </div>
                        <p className={`mt-2 text-[11px] font-medium ${index <= currentIndex ? "text-leaf-700" : "text-stone-400"}`}>{statusLabel(status, lang)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.status === "CANCELLED" && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <XCircle className="h-5 w-5" /> {t("track.cancelled")}
                </div>
              )}
              {order.status === "RETURNED" && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-stone-200 bg-cream-100 p-4 text-sm text-stone-700">
                  <XCircle className="h-5 w-5" /> {t("track.returned")}
                </div>
              )}
            </div>

            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="font-semibold text-stone-900">{t("track.items")}</h2>
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

            <div className="grid gap-6 sm:grid-cols-2">
              <section className="rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="flex items-center gap-2 font-semibold text-stone-900">
                  <MapPin className="h-4 w-4 text-leaf-600" /> {t("checkout.address")}
                </h2>
                <div className="mt-3 text-sm text-stone-600">
                  <p className="font-medium text-stone-800">{order.shippingName} · {order.shippingPhone}</p>
                  <p>{order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="font-display text-xl text-stone-900">{t("cart.summary")}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-stone-500">{t("common.subtotal")}</dt><dd>{money(order.subtotal)}</dd></div>
                  {Number(order.discount) > 0 && <div className="flex justify-between text-leaf-700"><dt>{t("common.discount")}</dt><dd>-{money(order.discount)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-stone-500">{t("common.delivery")}</dt><dd>{money(order.deliveryFee)}</dd></div>
                  <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold"><dt>{t("common.total")}</dt><dd>{money(order.total)}</dd></div>
                </dl>
                <p className="mt-3 border-t border-stone-200 pt-3 text-xs text-stone-500">
                  {t("common.status")}: <StatusBadge status={order.paymentStatus} />
                </p>
              </section>
            </div>

            {order.statusHistory && order.statusHistory.length > 0 && (
              <section className="rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="font-semibold text-stone-900">{t("track.history")}</h2>
                <div className="mt-4 space-y-3">
                  {order.statusHistory.map((entry) => (
                    <div key={entry.id} className="flex gap-3 text-sm">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-leaf-500" />
                      <div>
                        <p className="font-medium text-stone-700">{statusLabel(entry.status, lang)}</p>
                        <p className="text-xs text-stone-400">{dateTime(entry.createdAt, lang)}{entry.note ? ` · ${entry.note}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={reset} className="btn-secondary">
                <Search className="h-4 w-4" /> {t("track.another")}
              </button>
              <Link to="/contact" className="btn-secondary">{t("nav.contact")}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
