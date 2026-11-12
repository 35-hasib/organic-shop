import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, MapPin, Tag, Truck } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Address, DeliveryArea, Order } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";
import { idempotencyKey, money } from "../lib/format";
import { PageHeader } from "../components/PageHeader";
import { AddressForm } from "../components/AddressForm";
import { EmptyState } from "../components/Loading";
import { GuestCheckout } from "./GuestCheckout";

export function Checkout() {
  const { user } = useAuth();
  if (user?.role === "CUSTOMER") return <MemberCheckout />;
  return <GuestCheckout />;
}

function MemberCheckout() {
  const { t, lang, pick } = useLanguage();
  const { cart, refreshCart } = useShop();
  const { show } = useToast();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [addressId, setAddressId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [note, setNote] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const key = useRef(idempotencyKey());

  const load = async () => {
    const [addressData, areaData] = await Promise.all([
      api<{ addresses: Address[] }>("/addresses"),
      api<{ areas: DeliveryArea[] }>("/delivery-areas", { auth: false }),
    ]);
    setAddresses(addressData.addresses);
    setAreas(areaData.areas);
    setAddressId((current) => current || addressData.addresses.find((address) => address.isDefault)?.id || addressData.addresses[0]?.id || "");
    setAreaId((current) => current || areaData.areas[0]?.id || "");
  };

  useEffect(() => {
    load().catch((err) => setError(errorMessage(err)));
  }, []);

  const area = areas.find((item) => item.id === areaId);
  const subtotal = Number(cart.subtotal);
  const afterDiscount = Math.max(0, subtotal - discount);
  const free = area?.freeDeliveryThreshold ? afterDiscount >= Number(area.freeDeliveryThreshold) : false;
  const deliveryFee = area ? (free ? 0 : Number(area.charge)) : 0;
  const total = afterDiscount + deliveryFee;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const data = await api<{ code: string; discount: string; description?: string }>("/coupons/validate", { method: "POST", body: { code: coupon.trim() } });
      setDiscount(Number(data.discount));
      setCouponApplied(data.code);
      show(lang === "bn" ? "কুপন প্রয়োগ হয়েছে" : "Coupon applied");
    } catch (err) {
      setDiscount(0);
      setCouponApplied("");
      show(errorMessage(err), "error");
    }
  };

  const saveAddress = async (data: Partial<Address>) => {
    setSavingAddress(true);
    try {
      const created = await api<{ address: Address }>("/addresses", { method: "POST", body: data });
      await load();
      setAddressId(created.address.id);
      setAddingAddress(false);
      show(lang === "bn" ? "ঠিকানা সংরক্ষিত হয়েছে" : "Address saved");
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    setError("");
    if (!addressId || !areaId) {
      setError(t("checkout.noAddress"));
      return;
    }
    setPlacing(true);
    try {
      const data = await api<{ order: Order }>("/orders", {
        method: "POST",
        body: {
          addressId,
          deliveryAreaId: areaId,
          couponCode: couponApplied || undefined,
          paymentMethod: "COD",
          note: note || undefined,
          idempotencyKey: key.current,
        },
      });
      await refreshCart();
      navigate(`/account/orders/${data.order.id}?placed=1`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div>
        <PageHeader title={t("checkout.title")} />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState title={t("checkout.empty")} action={<Link to="/shop" className="btn-primary">{t("cart.continue")}</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("checkout.title")} subtitle={lang === "bn" ? "ঠিকানা নিশ্চিত করুন এবং অর্ডার সম্পন্ন করুন।" : "Confirm your delivery details and place the order."} />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-2xl text-stone-900"><MapPin className="h-5 w-5 text-leaf-600" /> {t("checkout.address")}</h2>
              {!addingAddress && <button type="button" onClick={() => setAddingAddress(true)} className="text-sm font-semibold text-leaf-700">+ {t("checkout.newAddress")}</button>}
            </div>
            {addresses.length === 0 && !addingAddress ? (
              <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center">
                <p className="text-sm text-stone-500">{t("checkout.noAddress")}</p>
                <button type="button" onClick={() => setAddingAddress(true)} className="btn-primary mt-4">{t("account.addAddress")}</button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label key={address.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${addressId === address.id ? "border-leaf-500 bg-leaf-50/50" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                    <input type="radio" name="address" checked={addressId === address.id} onChange={() => setAddressId(address.id)} className="mt-1 h-4 w-4 border-stone-300 text-leaf-700 focus:ring-leaf-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-900">{address.recipientName}</span>
                        <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">{address.label}</span>
                        {address.isDefault && <span className="text-[10px] font-semibold text-leaf-600">{t("account.default")}</span>}
                      </div>
                      <p className="mt-1 text-sm text-stone-600">{address.addressLine}, {address.area}, {address.district}, {address.division}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{address.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {addingAddress && (
              <div className="mt-4">
                <AddressForm onSubmit={saveAddress} onCancel={() => setAddingAddress(false)} busy={savingAddress} />
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-2xl text-stone-900"><Truck className="h-5 w-5 text-leaf-600" /> {t("checkout.area")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {areas.map((item) => (
                <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${areaId === item.id ? "border-leaf-500 bg-leaf-50/50" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                  <input type="radio" name="area" checked={areaId === item.id} onChange={() => setAreaId(item.id)} className="mt-1 h-4 w-4 border-stone-300 text-leaf-700 focus:ring-leaf-500" />
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{pick(item, "name")}</p>
                    <p className="text-xs text-stone-500">{money(item.charge)} {lang === "bn" ? "ডেলিভারি চার্জ" : "delivery charge"}</p>
                    {item.freeDeliveryThreshold && <p className="mt-0.5 text-[11px] text-leaf-600">{lang === "bn" ? `৳${Number(item.freeDeliveryThreshold).toLocaleString()} এর বেশি অর্ডারে ফ্রি` : `Free over ${money(item.freeDeliveryThreshold)}`}</p>}
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-display text-2xl text-stone-900"><Tag className="h-5 w-5 text-leaf-600" /> {t("checkout.coupon")}</h2>
            <div className="mt-4 flex gap-2">
              <input value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} className="input" placeholder="ORGANIC10" />
              <button type="button" onClick={applyCoupon} className="btn-secondary shrink-0">{t("checkout.apply")}</button>
            </div>
            {couponApplied && <p className="mt-2 flex items-center gap-1 text-sm text-leaf-700"><Check className="h-4 w-4" /> {t("checkout.couponApplied")}: {couponApplied}</p>}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-display text-2xl text-stone-900">{t("checkout.payment")}</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-leaf-500 bg-leaf-50/50 p-4">
              <input type="radio" checked readOnly className="mt-1 h-4 w-4 text-leaf-700" />
              <div>
                <p className="text-sm font-semibold text-stone-900">{t("checkout.cod")}</p>
                <p className="text-xs text-stone-500">{t("checkout.codNote")}</p>
              </div>
            </label>
            <div className="mt-4">
              <label className="label">{t("common.note")} <span className="font-normal text-stone-400">({t("common.optional")})</span></label>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="input" placeholder={lang === "bn" ? "ডেলিভারি সম্পর্কিত নির্দেশনা" : "Delivery instructions"} />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl text-stone-900">{t("cart.summary")}</h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <img src={item.product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-stone-800">{pick(item.product, "name")}</p>
                  <p className="text-xs text-stone-500">{item.quantity} × {money(item.unitPrice)}</p>
                </div>
                <p className="text-sm font-semibold">{money(item.lineTotal)}</p>
              </div>
            ))}
          </div>
          <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-stone-500">{t("common.subtotal")}</dt><dd>{money(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-leaf-700"><dt>{t("common.discount")}</dt><dd>-{money(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-stone-500">{t("common.delivery")}</dt><dd>{area ? (free ? (lang === "bn" ? "ফ্রি" : "Free") : money(deliveryFee)) : "-"}</dd></div>
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold"><dt>{t("common.total")}</dt><dd>{money(total)}</dd></div>
          </dl>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <button type="button" onClick={placeOrder} disabled={placing || !addressId || !areaId} className="btn-primary mt-5 w-full">{placing ? t("common.loading") : t("checkout.placeOrder")}</button>
          <p className="mt-3 text-center text-[11px] text-stone-500">{t("checkout.terms")}</p>
        </aside>
      </div>
    </div>
  );
}
