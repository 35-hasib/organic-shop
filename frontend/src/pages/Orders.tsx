import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Order } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { date, money } from "../lib/format";
import { StatusBadge } from "../components/StatusBadge";
import { Select } from "../components/Select";
import { EmptyState, ErrorState, Loading } from "../components/Loading";
import { useSearchParams } from "react-router-dom";

export function Orders() {
  const { t, lang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<{ orders: Order[] }>(`/orders?pageSize=50${status ? `&status=${status}` : ""}`)
      .then((data) => active && setOrders(data.orders))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-stone-900">{t("account.orders")}</h2>
        <Select value={status} onChange={(event) => setParams(event.target.value ? { status: event.target.value } : {})} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm">
          <option value="">{lang === "bn" ? "সব অর্ডার" : "All orders"}</option>
          {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </Select>
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t("account.ordersEmpty")} action={<Link to="/shop" className="btn-primary">{t("cart.continue")}</Link>} />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/account/orders/${order.id}`} className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-leaf-300 hover:shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-stone-900">{order.orderNumber}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{date(order.createdAt, lang)} · {order.items.length} {lang === "bn" ? "টি পণ্য" : "items"}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-900">{money(order.total)}</p>
                  <p className="text-xs text-stone-500">{money(order.deliveryFee)} {lang === "bn" ? "ডেলিভারি" : "delivery"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 4).map((item) => (
                    <img key={item.id} src={item.imageUrl || ""} alt="" className="h-9 w-9 rounded-full border-2 border-white bg-cream-100 object-cover" />
                  ))}
                  {order.items.length > 4 && <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-cream-200 text-[10px] font-semibold">+{order.items.length - 4}</span>}
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-leaf-700">{lang === "bn" ? "বিস্তারিত" : "View details"} <ChevronRight className="h-4 w-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
