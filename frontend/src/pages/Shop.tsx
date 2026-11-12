import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Category, Product } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { ProductCard } from "../components/ProductCard";
import { Select } from "../components/Select";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, ErrorState, Loading } from "../components/Loading";
import { SectionHeading } from "../components/SectionHeading";
import { Seo } from "../lib/seo";

export function Shop() {
  const { t, lang, pick } = useLanguage();
  const { slug: routeCategory } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = params.toString();
  const page = Number(params.get("page") || 1);
  const pageSize = 12;
  const selectedCategory = routeCategory || params.get("category") || "";
  const sort = params.get("sort") || "newest";
  const q = params.get("q") || "";
  const inStock = params.get("inStock") === "1";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";

  useEffect(() => {
    api<{ categories: Category[] }>("/categories?flat=1", { auth: false })
      .then((data) => setCategories(data.categories))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const search = new URLSearchParams(query);
    search.delete("category");
    if (selectedCategory) search.set("category", selectedCategory);
    search.set("pageSize", String(pageSize));
    api<{ products: Product[]; total: number }>(`/products?${search.toString()}`, { auth: false })
      .then((data) => {
        if (!active) return;
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query, selectedCategory]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    if (key === "category") {
      next.delete("category");
      const suffix = next.toString();
      if (value) navigate(`/category/${encodeURIComponent(value)}${suffix ? `?${suffix}` : ""}`);
      else navigate(`/shop${suffix ? `?${suffix}` : ""}`);
      return;
    }
    setParams(next);
  };

  const updatePrice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams(params);
    const min = String(form.get("minPrice") || "");
    const max = String(form.get("maxPrice") || "");
    min ? next.set("minPrice", min) : next.delete("minPrice");
    max ? next.set("maxPrice", max) : next.delete("maxPrice");
    next.delete("page");
    setParams(next);
  };

  const clearFilters = () => {
    setFiltersOpen(false);
    if (routeCategory) navigate("/shop");
    else setParams(new URLSearchParams());
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const activeCount = [selectedCategory, inStock, minPrice, maxPrice].filter(Boolean).length;
  const title = q ? `${lang === "bn" ? "অনুসন্ধান" : "Search"}: ${q}` : t("shop.title");
  const flatCategories = useMemo(() => categories, [categories]);
  const activeCategory = flatCategories.find((category) => category.slug === selectedCategory);
  const canonicalCategory = routeCategory || params.get("category") || "";
  const canonicalPath = canonicalCategory ? `/category/${encodeURIComponent(canonicalCategory)}` : "/shop";
  const seoTitle = activeCategory
    ? `Buy ${pick(activeCategory, "name")} Online in Bangladesh | Organic Shop`
    : q
      ? `${lang === "bn" ? "অনুসন্ধান" : "Search"}: ${q} | Organic Shop Bangladesh`
      : "Shop Organic Food Online in Bangladesh | Organic Shop";
  const seoDescription = activeCategory
    ? `Buy ${pick(activeCategory, "name")} online from Organic Shop Bangladesh. Carefully sourced organic food from trusted farms, delivered nationwide with clear product details.`
    : "Shop organic food online at Organic Shop Bangladesh for pure honey, deshi ghee, gur, cold-pressed oils, spices, rice, lentils, fruits, vegetables and herbal tea with nationwide delivery.";

  const filters = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800">{t("shop.categories")}</h3>
        <div className="mt-3 space-y-1">
          <button onClick={() => setParam("category", null)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${!selectedCategory ? "bg-leaf-100 font-semibold text-leaf-800" : "text-stone-600 hover:bg-cream-100"}`}>
            {t("shop.all")}
          </button>
          {flatCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setParam("category", category.slug)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selectedCategory === category.slug ? "bg-leaf-100 font-semibold text-leaf-800" : "text-stone-600 hover:bg-cream-100"}`}
            >
              {pick(category, "name")}
              {category._count && <span className="ml-1 text-xs text-stone-400">({category._count.products})</span>}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={updatePrice}>
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800">{t("shop.price")}</h3>
        <div className="mt-3 flex items-center gap-2">
          <input name="minPrice" type="number" min="0" defaultValue={minPrice} placeholder={t("shop.min")} className="input py-2 text-sm" />
          <span className="text-stone-400">-</span>
          <input name="maxPrice" type="number" min="0" defaultValue={maxPrice} placeholder={t("shop.max")} className="input py-2 text-sm" />
        </div>
        <button className="mt-2 text-xs font-semibold text-leaf-700 hover:text-leaf-900">{lang === "bn" ? "মূল্য প্রয়োগ করুন" : "Apply price"}</button>
      </form>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" checked={inStock} onChange={(event) => setParam("inStock", event.target.checked ? "1" : null)} className="h-4 w-4 rounded border-stone-300 text-leaf-700 focus:ring-leaf-500" />
        {t("shop.inStock")}
      </label>
      {activeCount > 0 && (
        <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-semibold text-clay-500 hover:text-clay-600">
          <X className="h-3.5 w-3.5" /> {t("shop.clear")}
        </button>
      )}
    </div>
  );

  return (
    <div>
      <Seo title={seoTitle} description={seoDescription} canonicalPath={canonicalPath} />
      <PageHeader title={activeCategory ? pick(activeCategory, "name") : title} subtitle={activeCategory ? pick(activeCategory, "description") || t("shop.subtitle") : t("shop.subtitle")} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-500">{total} {t("shop.results")}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> {t("shop.filters")} {activeCount > 0 && `(${activeCount})`}
            </button>
            <Select value={sort} onChange={(event) => setParam("sort", event.target.value)} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm outline-none">
              <option value="newest">{t("shop.newest")}</option>
              <option value="price_asc">{t("shop.priceLow")}</option>
              <option value="price_desc">{t("shop.priceHigh")}</option>
              <option value="name">{t("shop.name")}</option>
              <option value="rating">{t("shop.rating")}</option>
              <option value="best_selling">{t("shop.bestSelling")}</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-stone-200 bg-white p-5">{filters}</div>
          </aside>
          <div>
            {loading ? (
              <Loading />
            ) : error ? (
              <ErrorState message={error} />
            ) : products.length === 0 ? (
              <EmptyState
                title={t("shop.empty")}
                action={<button onClick={clearFilters} className="btn-primary">{t("shop.clear")}</button>}
              />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
                {pageCount > 1 && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    <button disabled={page <= 1} onClick={() => setParam("page", String(page - 1))} className="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:opacity-40">
                      {lang === "bn" ? "পূর্ববর্তী" : "Previous"}
                    </button>
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => setParam("page", String(number))}
                        className={`h-9 w-9 rounded-full text-sm ${number === page ? "bg-leaf-700 text-white" : "border border-stone-300 bg-white text-stone-600"}`}
                      >
                        {number}
                      </button>
                    ))}
                    <button disabled={page >= pageCount} onClick={() => setParam("page", String(page + 1))} className="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:opacity-40">
                      {lang === "bn" ? "পরবর্তী" : "Next"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button className="absolute inset-0 bg-stone-900/40" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <SectionHeading title={t("shop.filters")} />
              <button onClick={() => setFiltersOpen(false)} className="rounded-full bg-stone-100 p-2"><X className="h-5 w-5" /></button>
            </div>
            {filters}
            <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-6 w-full">{lang === "bn" ? "ফলাফল দেখুন" : "Show results"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
