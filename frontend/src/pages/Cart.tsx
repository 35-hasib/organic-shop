import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";
import { money } from "../lib/format";
import { errorMessage } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/Loading";
import { QuantityInput } from "../components/QuantityInput";

export function Cart() {
  const { t, pick, lang } = useLanguage();
  const { cart, updateCart, removeItem, cartLoading } = useShop();
  const { show } = useToast();
  const navigate = useNavigate();

  const change = async (id: string, quantity: number) => {
    try {
      await updateCart(id, quantity);
    } catch (error) {
      show(errorMessage(error), "error");
    }
  };

  const remove = async (id: string) => {
    try {
      await removeItem(id);
      show(lang === "bn" ? "কার্ট থেকে সরানো হয়েছে" : "Removed from cart");
    } catch (error) {
      show(errorMessage(error), "error");
    }
  };

  return (
    <div>
      <PageHeader title={t("cart.title")} subtitle={lang === "bn" ? "আপনার বাছাই করা পণ্যগুলো দেখুন।" : "Review the good things you have picked."} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {cart.items.length === 0 ? (
          <EmptyState
            title={t("cart.empty")}
            text={t("cart.emptyText")}
            action={<Link to="/shop" className="btn-primary">{t("cart.continue")}</Link>}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
                  <Link to={`/product/${item.product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-100 sm:h-28 sm:w-28">
                    <img src={item.product.images[0]} alt={pick(item.product, "name")} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/product/${item.product.slug}`} className="font-display text-lg leading-snug text-stone-900 hover:text-leaf-700">
                          {pick(item.product, "name")}
                        </Link>
                        <p className="mt-0.5 text-xs text-stone-500">{item.product.unit}</p>
                      </div>
                      <button onClick={() => remove(item.id)} className="rounded-full p-2 text-stone-400 hover:bg-red-50 hover:text-red-500" aria-label={t("cart.remove")}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <QuantityInput compact value={item.quantity} onChange={(quantity) => change(item.id, quantity)} max={Math.min(item.product.stock, 99)} />
                      <div className="text-right">
                        <p className="font-bold text-stone-900">{money(item.lineTotal)}</p>
                        <p className="text-xs text-stone-500">{money(item.unitPrice)} / {item.product.unit}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-leaf-700 hover:text-leaf-900">
                <ArrowRight className="h-4 w-4 rotate-180" /> {t("cart.continue")}
              </Link>
            </div>

            <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-2xl text-stone-900">{t("cart.summary")}</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-stone-500">{t("common.subtotal")}</dt><dd className="font-medium">{money(cart.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-500">{t("common.delivery")}</dt><dd className="text-stone-500">{lang === "bn" ? "চেকআউটে" : "Calculated at checkout"}</dd></div>
                <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold"><dt>{t("common.total")}</dt><dd>{money(cart.subtotal)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-stone-500">{t("cart.couponNote")}</p>
              <button onClick={() => navigate("/checkout")} disabled={cartLoading} className="btn-primary mt-5 w-full">
                <ShoppingBag className="h-4 w-4" /> {t("cart.checkout")}
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
