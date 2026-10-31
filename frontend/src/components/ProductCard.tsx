import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Star } from "lucide-react";
import type { Product } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";
import { discountPercent, money } from "../lib/format";
import { errorMessage } from "../lib/api";

export function ProductCard({ product }: { product: Product }) {
  const { lang, pick, t } = useLanguage();
  const { user } = useAuth();
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const { show } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const saved = wishlist.includes(product.id);
  const off = discountPercent(product.price, product.salePrice);

  const add = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      show(t("product.added"));
    } catch (error) {
      show(errorMessage(error), "error");
    } finally {
      setAdding(false);
    }
  };

  const save = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    try {
      const added = await toggleWishlist(product.id);
      show(added ? (lang === "bn" ? "পছন্দের তালিকায় যোগ হয়েছে" : "Saved to wishlist") : (lang === "bn" ? "পছন্দের তালিকা থেকে সরানো হয়েছে" : "Removed from wishlist"));
    } catch (error) {
      show(errorMessage(error), "error");
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white transition hover:-translate-y-1 hover:border-leaf-200 hover:shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.images[0] || "https://images.unsplash.com/photo-1576394435759-02a2674ff6e0?auto=format&fit=crop&w=700&q=80"}
            alt={pick(product, "name")}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {off > 0 && <span className="rounded-full bg-clay-500 px-2.5 py-1 text-xs font-bold text-white">-{off}%</span>}
          {product.featured && <span className="rounded-full bg-leaf-700 px-2.5 py-1 text-xs font-semibold text-white">{lang === "bn" ? "বাছাই" : "Pick"}</span>}
        </div>
        <button
          onClick={save}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 ${saved ? "text-clay-500" : "text-stone-500"}`}
          aria-label="Save to wishlist"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-leaf-600">{product.category ? pick(product.category, "name") : product.unit}</p>
        <Link to={`/product/${product.slug}`} className="mt-1 font-display text-xl leading-snug text-stone-900 hover:text-leaf-700">
          {pick(product, "name")}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
          <Star className={`h-3.5 w-3.5 ${product.ratingAverage > 0 ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
          <span>{product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : "New"}</span>
          <span className="text-stone-300">|</span>
          <span>{product.unit}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-stone-900">{money(product.effectivePrice)}</span>
              {product.salePrice && <span className="text-sm text-stone-400 line-through">{money(product.price)}</span>}
            </div>
            <span className={`text-xs ${product.inStock ? "text-leaf-600" : "text-red-500"}`}>
              {product.inStock ? t("common.inStock") : t("common.outOfStock")}
            </span>
          </div>
          <button
            onClick={add}
            disabled={!product.inStock || adding}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf-700 text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            aria-label={t("common.addToCart")}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
