import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Truck, User, Wallet } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { DeliveryArea, Order } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";
import { idempotencyKey, money } from "../lib/format";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, Loading } from "../components/Loading";

interface GuestCustomer {
  name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  insideDhaka: boolean;
  note: string;
}

const blankForm = {
  phone: "",
  name: "",
  address: "",
  city: "",
  area: "",
  note: "",
};

export function GuestCheckout() {
  const { t, lang } = useLanguage();
  const { cart, cartLoading, clearCart } = useShop();
  const { show } = useToast();
  const navigate = useNavigate();
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [form, setForm] = useState(blankForm);
  const [location, setLocation] = useState<"inside" | "outside">("inside");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const key = useRef(idempotencyKey());

  useEffect(() => {
    api<{ areas: DeliveryArea[] }>("/delivery-areas", { auth: false })
      .then((data) => setAreas(data.areas))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const insideArea = areas.find((area) => area.district.toLowerCase() === "dhaka") || areas[0];
  const outsideArea =
    areas.find((area) => area.district.toLowerCase() === "other") ||
    areas.find((area) => area.id !== insideArea?.id) ||
    insideArea;
  const selectedArea = location === "outside" ? outsideArea : insideArea;

  const subtotal = Number(cart.subtotal);
  const free = selectedArea?.freeDeliveryThreshold ? subtotal >= Number(selectedArea.freeDeliveryThreshold) : false;
  const deliveryFee = selectedArea ? (free ? 0 : Number(selectedArea.charge)) : 0;
  const total = subtotal + deliveryFee;

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const lookup = async () => {
    const phone = form.phone.trim();
    if (phone.length < 6) return;
    try {
      const data = await api<{ customer: GuestCustomer | null }>(
        `/orders/guest/lookup?phone=${encodeURIComponent(phone)}`,
        { auth: false }
      );
      if (!data.customer) return;
      const customer = data.customer;
      setForm((current) => ({
        ...current,
        name: current.name || customer.name,
        address: current.address || customer.address,
        city: current.city || customer.city,
        area: current.area || customer.area,
        note: current.note || customer.note,
      }));
      setLocation(customer.insideDhaka ? "inside" : "outside");
      show(lang === "bn" ? "পুরনো অর্ডারের তথ্য পাওয়া গেছে" : "Previous order details found");
    } catch {
      // Auto-fill is best effort; the customer can still type their details.
    }
  };

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.area.trim()) {
      setError(lang === "bn" ? "অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন।" : "Please fill in all required fields.");
      return;
    }
    if (!selectedArea) {
      setError(lang === "bn" ? "ডেলিভারি লোকেশন নির্বাচন করুন।" : "Select a delivery location.");
      return;
    }
    setPlacing(true);
    try {
      const data = await api<{ order: Order }>("/orders/guest", {
        method: "POST",
        auth: false,
        body: {
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          area: form.area.trim(),
          deliveryAreaId: selectedArea.id,
          note: form.note.trim() || undefined,
          paymentMethod: "COD",
          items: cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          idempotencyKey: key.current,
        },
      });
      await clearCart();
      sessionStorage.setItem("organic_guest_phone", form.phone.trim());
      navigate(`/order-confirmed/${data.order.id}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (cartLoading) return <Loading />;

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
      <PageHeader
        title={t("checkout.title")}
        subtitle={lang === "bn" ? "অ্যাকাউন্ট ছাড়াই অর্ডার করুন। শুধু ডেলিভারি তথ্য দিন।" : "Order without an account. Just share your delivery details."}
      />
      <form onSubmit={placeOrder}>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
          <div className="space-y-6">
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-2xl text-stone-900">
                <User className="h-5 w-5 text-leaf-600" /> {lang === "bn" ? "ব্যক্তিগত তথ্য" : "Personal information"}
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="label">{lang === "bn" ? "মোবাইল নম্বর *" : "Mobile number *"}</label>
                  <input
                    value={form.phone}
                    onChange={update("phone")}
                    onBlur={lookup}
                    required
                    className="input"
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    {lang === "bn" ? "আগে অর্ডার করে থাকলে তথ্য স্বয়ংক্রিয়ভাবে পূরণ হবে" : "If you ordered before, your details will fill automatically."}
                  </p>
                </div>
                <div>
                  <label className="label">{lang === "bn" ? "আপনার নাম *" : "Your name *"}</label>
                  <input value={form.name} onChange={update("name")} required className="input" placeholder={lang === "bn" ? "পূর্ণ নাম লিখুন" : "Enter your full name"} autoComplete="name" />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-2xl text-stone-900">
                <MapPin className="h-5 w-5 text-leaf-600" /> {lang === "bn" ? "ডেলিভারি ঠিকানা" : "Delivery address"}
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="label">{lang === "bn" ? "বিস্তারিত ঠিকানা *" : "Full address *"}</label>
                  <textarea
                    value={form.address}
                    onChange={update("address")}
                    required
                    minLength={5}
                    rows={3}
                    className="input"
                    placeholder={lang === "bn" ? "বাড়ি/ফ্ল্যাট নম্বর, রাস্তা, মহল্লা..." : "House/flat number, road, neighbourhood..."}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">{lang === "bn" ? "শহর / জেলা *" : "City / district *"}</label>
                    <input value={form.city} onChange={update("city")} required className="input" placeholder={lang === "bn" ? "যেমন: ঢাকা, চট্টগ্রাম..." : "e.g. Dhaka, Chattogram..."} />
                  </div>
                  <div>
                    <label className="label">{lang === "bn" ? "এলাকা / থানা *" : "Area / thana *"}</label>
                    <input value={form.area} onChange={update("area")} required className="input" placeholder={lang === "bn" ? "যেমন: মিরপুর, গুলশান..." : "e.g. Mirpur, Gulshan..."} />
                  </div>
                </div>
                <div>
                  <label className="label">{lang === "bn" ? "ডেলিভারি লোকেশন *" : "Delivery location *"}</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {insideArea && (
                      <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${location === "inside" ? "border-leaf-500 bg-leaf-50/50" : "border-stone-200 hover:border-stone-300"}`}>
                        <input type="radio" name="location" checked={location === "inside"} onChange={() => setLocation("inside")} className="mt-1 h-4 w-4 text-leaf-700 focus:ring-leaf-500" />
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{lang === "bn" ? "ঢাকার ভেতরে" : "Inside Dhaka"}</p>
                          <p className="text-xs text-stone-500">
                            {lang === "bn" ? `ডেলিভারি চার্জ: ${money(insideArea.charge)} থেকে` : `Delivery charge: from ${money(insideArea.charge)}`}
                          </p>
                        </div>
                      </label>
                    )}
                    {outsideArea && (
                      <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${location === "outside" ? "border-leaf-500 bg-leaf-50/50" : "border-stone-200 hover:border-stone-300"}`}>
                        <input type="radio" name="location" checked={location === "outside"} onChange={() => setLocation("outside")} className="mt-1 h-4 w-4 text-leaf-700 focus:ring-leaf-500" />
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{lang === "bn" ? "ঢাকার বাইরে" : "Outside Dhaka"}</p>
                          <p className="text-xs text-stone-500">
                            {lang === "bn" ? `ডেলিভারি চার্জ: ${money(outsideArea.charge)} থেকে` : `Delivery charge: from ${money(outsideArea.charge)}`}
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <label className="label">{lang === "bn" ? "বিশেষ নির্দেশনা (ঐচ্ছিক)" : "Special instructions (optional)"}</label>
              <textarea
                value={form.note}
                onChange={update("note")}
                rows={2}
                className="input"
                placeholder={lang === "bn" ? "কোনো বিশেষ নির্দেশনা থাকলে লিখুন..." : "Any delivery instructions..."}
              />
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-2xl text-stone-900">
                <Wallet className="h-5 w-5 text-leaf-600" /> {t("checkout.payment")}
              </h2>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-leaf-500 bg-leaf-50/50 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-700 text-sm font-bold text-white">৳</span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{t("checkout.cod")}</p>
                  <p className="text-xs text-stone-500">{t("checkout.codNote")}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 lg:sticky lg:top-28">
            <h2 className="flex items-center gap-2 font-display text-2xl text-stone-900">
              <Truck className="h-5 w-5 text-leaf-600" /> {t("cart.summary")}
            </h2>
            <div className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-stone-800">
                      {lang === "bn" && item.product.nameBn ? item.product.nameBn : item.product.name}
                    </p>
                    <p className="text-xs text-stone-500">{item.quantity} × {money(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold">{money(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">{t("common.subtotal")}</dt><dd>{money(subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-stone-500">{lang === "bn" ? "ডেলিভারি চার্জ" : "Delivery charge"}</dt>
                <dd>{selectedArea ? (free ? (lang === "bn" ? "ফ্রি" : "Free") : money(deliveryFee)) : "-"}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold"><dt>{t("common.total")}</dt><dd>{money(total)}</dd></div>
            </dl>
            {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={placing || !selectedArea} className="btn-primary mt-5 w-full">
              {placing ? t("common.loading") : (lang === "bn" ? "অর্ডার কনফার্ম করুন" : "Confirm order")}
            </button>
            <p className="mt-3 text-center text-[11px] text-stone-500">
              {lang === "bn" ? "ক্যাশ অন ডেলিভারি — পণ্য পাওয়ার পরে পরিশোধ করুন" : "Cash on delivery — pay after receiving the product."}
            </p>
          </aside>
        </div>
      </form>
    </div>
  );
}
