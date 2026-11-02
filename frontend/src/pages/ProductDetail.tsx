import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Heart, Leaf, MapPin, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Product } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";
import { discountPercent, money } from "../lib/format";
import { Loading, ErrorState } from "../components/Loading";
import { QuantityInput } from "../components/QuantityInput";
import { ProductCard } from "../components/ProductCard";
import { useSeo } from "../lib/seo";

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, lang, pick } = useLanguage();
  const { user } = useAuth();
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const { show } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<{ product: Product }>(`/products/slug/${slug}`, { auth: false });
      setProduct(data.product);
      setActiveImage(0);
      if (data.product.categoryId) {
        const list = await api<{ products: Product[] }>(`/products?category=${data.product.category?.slug || data.product.categoryId}&pageSize=5`, { auth: false });
        setRelated(list.products.filter((item) => item.id !== data.product.id).slice(0, 4));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setQuantity(1);
  }, [slug]);

  const saved = product ? wishlist.includes(product.id) : false;
  const off = product ? discountPercent(product.price, product.salePrice) : 0;
  const userReview = useMemo(() => {
    if (!product || !user) return null;
    return product.reviews?.find((review) => review.user.name === user.name) || null;
  }, [product, user]);
  const productName = product ? pick(product, "name") : "";
  const productDescription = product ? pick(product, "description").replace(/\s+/g, " ").trim() : "";
  const seoDescription = product
    ? `${productName} from Organic Shop Bangladesh. ${productDescription || "Pure, carefully sourced organic food delivered across Bangladesh."}`.slice(0, 158)
    : "Browse pure honey, deshi ghee, gur, doi, dudh and other organic food from trusted Bangladeshi farms.";
  useSeo({
    title: product ? `Buy ${productName} Online in Bangladesh | Organic Shop` : "Organic Food Products | Organic Shop Bangladesh",
    description: seoDescription,
    canonicalPath: slug ? `/product/${encodeURIComponent(slug)}` : "/shop",
    image: product?.images?.[0],
  });

  const add = async () => {
    if (!product) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      show(t("product.added"));
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setAdding(false);
    }
  };

  const save = async () => {
    if (!product) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    try {
      const added = await toggleWishlist(product.id);
      show(added ? (lang === "bn" ? "পছন্দের তালিকায় যোগ হয়েছে" : "Saved to wishlist") : (lang === "bn" ? "সরানো হয়েছে" : "Removed from wishlist"));
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;
    setReviewing(true);
    try {
      await api("/reviews", { method: "POST", body: { productId: product.id, rating, comment } });
      show(lang === "bn" ? "রিভিউ জমা হয়েছে" : "Review submitted");
      setComment("");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !product) return <ErrorState message={error || t("error.generic")} onRetry={load} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-stone-500">
        <Link to="/" className="hover:text-leaf-700">{t("nav.home")}</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-leaf-700">{t("nav.shop")}</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/category/${product.category.slug}`} className="hover:text-leaf-700">{pick(product.category, "name")}</Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-stone-700">{pick(product, "name")}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-cream-100">
            <img src={product.images[activeImage] || product.images[0]} alt={pick(product, "name")} className="aspect-square w-full object-cover" />
            {off > 0 && <span className="absolute left-4 top-4 rounded-full bg-clay-500 px-3 py-1.5 text-sm font-bold text-white">-{off}%</span>}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setActiveImage(index)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${activeImage === index ? "border-leaf-600" : "border-transparent"}`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-600">{product.category ? pick(product.category, "name") : product.unit}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-stone-900">{pick(product, "name")}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <Star className={`h-4 w-4 ${product.ratingAverage > 0 ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
              {product.ratingAverage > 0 ? `${product.ratingAverage.toFixed(1)} · ${product.reviewCount} ${t("product.reviews")}` : (lang === "bn" ? "নতুন পণ্য" : "New product")}
            </span>
            <span className="text-stone-300">|</span>
            <span>SKU: {product.sku}</span>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-3xl font-bold text-stone-900">{money(product.effectivePrice)}</span>
            {product.salePrice && <span className="pb-1 text-lg text-stone-400 line-through">{money(product.price)}</span>}
            <span className="pb-1 text-sm text-stone-500">/ {product.unit}</span>
          </div>

          <p className="mt-5 leading-relaxed text-stone-600">{pick(product, "description")}</p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${product.inStock ? "bg-leaf-50 text-leaf-700" : "bg-red-50 text-red-600"}`}>
              <Leaf className="h-3.5 w-3.5" /> {product.inStock ? t("common.inStock") : t("common.outOfStock")}
            </span>
            {product.origin && <span className="flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1.5 text-stone-700"><MapPin className="h-3.5 w-3.5" /> {pick(product, "origin")}</span>}
            {product.certification && <span className="flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1.5 text-stone-700"><ShieldCheck className="h-3.5 w-3.5" /> {pick(product, "certification")}</span>}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuantityInput value={quantity} onChange={setQuantity} max={Math.min(product.stock, 99)} />
            <button onClick={add} disabled={!product.inStock || adding} className="btn-primary min-w-48 flex-1 sm:flex-none">
              <ShoppingBag className="h-4 w-4" /> {adding ? t("common.loading") : t("common.addToCart")}
            </button>
            <button onClick={save} className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${saved ? "border-clay-200 bg-clay-50 text-clay-500" : "border-stone-300 text-stone-500 hover:text-leaf-700"}`} aria-label={t("nav.wishlist")}>
              <Heart className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
            </button>
          </div>

          <div className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {[
              { label: t("product.ingredients"), value: pick(product, "ingredients") },
              { label: t("product.origin"), value: pick(product, "origin") },
              { label: t("product.storage"), value: pick(product, "storageInstructions") },
              { label: t("product.certification"), value: pick(product, "certification") },
            ].filter((row) => row.value).map((row) => (
              <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
                <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">{row.label}</dt>
                <dd className="text-sm text-stone-700">{row.value}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-stone-200 pt-10">
        <h2 className="font-display text-3xl text-stone-900">{t("product.reviewTitle")} <span className="text-lg text-stone-400">({product.reviewCount})</span></h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-800">{review.user.name}</p>
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-stone-200"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-stone-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="mt-3 text-sm leading-relaxed text-stone-600">{review.comment}</p>}
                  <p className="mt-3 flex items-center gap-1 text-xs text-leaf-600"><ShieldCheck className="h-3.5 w-3.5" /> {t("product.verified")}</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                {lang === "bn" ? "এখনো কোনো রিভিউ নেই।" : "No reviews yet."}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-cream-100 p-6">
            <h3 className="font-display text-xl text-stone-900">{t("product.writeReview")}</h3>
            <p className="mt-1 text-xs text-stone-500">{t("product.reviewNote")}</p>
            {user ? (
              <form onSubmit={submitReview} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-600">{t("product.yourRating")}</label>
                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`}>
                        <Star className={`h-7 w-7 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">{t("product.comment")}</label>
                  <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} className="input mt-1" placeholder={lang === "bn" ? "পণ্যটি কেমন লেগেছে?" : "How did you like this product?"} />
                </div>
                {userReview && <p className="text-xs text-leaf-700">{lang === "bn" ? "আপনি ইতিমধ্যে রিভিউ দিয়েছেন। নতুন রিভিউ আগেরটি প্রতিস্থাপন করবে।" : "You already reviewed this product. Submitting again will update it."}</p>}
                <button disabled={reviewing} className="btn-primary w-full">{reviewing ? t("common.loading") : t("product.submitReview")}</button>
              </form>
            ) : (
              <Link to={`/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`} className="btn-primary mt-4 w-full">{t("nav.login")}</Link>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl text-stone-900">{t("product.related")}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
