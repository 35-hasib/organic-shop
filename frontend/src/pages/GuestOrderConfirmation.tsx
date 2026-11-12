import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, MapPin, PackageSearch, ShoppingBag } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Order } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { dateTime, money } from "../lib/format";
import { ErrorState, Loading } from "../components/Loading";

export function GuestOrderConfirmation() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { t, lang } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const phone = params.get("phone") || sessionStorage.getItem("organic_guest_phone") || "";
    if (!id || !phone) {
      setError(lang === "bn" ? "অর্ডার দেখতে মোবাইল নম্বর প্রয়োজন।" : "A mobile number is required to view this order.");
      setLoading(false);
      return;
    }
    api<{ order: Order }>(`/orders/guest/${id}?phone=${encodeURIComponent(phone)}`, { auth: false })
      .then((data) => setOrder(data.order))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error || !order) return <ErrorState message={error || t("error.generic")} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3 rounded-2xl border border-leaf-200 bg-leaf-50 p-5 text-leaf-800">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
        <div>
          <h1 className="font-display text-2xl">{lang === "bn" ? "অর্ডার সফলভাবে জমা হয়েছে" : "Order placed successfully"}</h1>
          <p className="mt-1 text-sm">
            {lang === "bn"
              ? "আমরা শীঘ্রই আপনার মোবাইল নম্বরে যোগাযোগ করে অর্ডার নিশ্চিত করব।"
              : "We will contact you shortly on your mobile number to confirm the order."}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{lang === "bn" ? "অর্ডার নম্বর" : "Order number"}</p>
            <p className="mt-1 font-display text-3xl text-stone-900">{order.orderNumber}</p>
          </div>
          <p className="text-sm text-stone-500">{dateTime(order.createdAt, lang)}</p>
        </div>

        <div className="mt-6 space-y-4 border-t border-stone-200 pt-5">
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

        <div className="mt-6 grid gap-5 border-t border-stone-200 pt-5 sm:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <MapPin className="h-4 w-4 text-leaf-600" /> {lang === "bn" ? "ডেলিভারি ঠিকানা" : "Delivery address"}
            </h2>
            <div className="mt-2 text-sm text-stone-600">
              <p className="font-medium text-stone-800">{order.shippingName} · {order.shippingPhone}</p>
              <p>{order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}</p>
            </div>
            {order.note && <p className="mt-3 rounded-xl bg-cream-100 p-3 text-xs text-stone-600">{order.note}</p>}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-stone-500">{t("common.subtotal")}</dt><dd>{money(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">{lang === "bn" ? "ডেলিভারি চার্জ" : "Delivery charge"}</dt><dd>{money(order.deliveryFee)}</dd></div>
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold"><dt>{t("common.total")}</dt><dd>{money(order.total)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to={`/track?order=${encodeURIComponent(order.orderNumber)}`} className="btn-primary flex-1">
          <PackageSearch className="h-4 w-4" /> {t("nav.track")}
        </Link>
        <Link to="/shop" className="btn-secondary flex-1">
          <ShoppingBag className="h-4 w-4" /> {t("cart.continue")}
        </Link>
      </div>
    </div>
  );
}
