import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, HeartHandshake, Leaf, Sprout, Truck } from "lucide-react";
import { api } from "../lib/api";
import type { Banner, Category, Product } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { SectionHeading } from "../components/SectionHeading";
import { ProductCard } from "../components/ProductCard";
import { Loading, ErrorState } from "../components/Loading";

export function Home() {
  const { t, lang, pick } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newest, setNewest] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [bannerData, categoryData, featuredData, newestData] = await Promise.all([
        api<{ banners: Banner[] }>("/banners", { auth: false }),
        api<{ categories: Category[] }>("/categories?flat=1", { auth: false }),
        api<{ products: Product[] }>("/products?featured=1&pageSize=8", { auth: false }),
        api<{ products: Product[] }>("/products?sort=newest&pageSize=4", { auth: false }),
      ]);
      setBanners(bannerData.banners);
      setCategories(categoryData.categories);
      setFeatured(featuredData.products);
      setNewest(newestData.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the store");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const hero = banners[0];
  const sideBanner = banners[1];

  return (
    <div>
      <section className="relative overflow-hidden bg-leaf-950">
        <img
          src={hero?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80"}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-leaf-950 via-leaf-950/80 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-36">
          <div className="max-w-2xl text-cream-50">
            <span className="inline-flex items-center gap-2 rounded-full border border-cream-100/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
              <Sprout className="h-3.5 w-3.5" />
              {lang === "bn" ? "খামার থেকে সরাসরি" : "Farm to family"}
            </span>
            <h1 className="mt-6 font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              {hero ? (lang === "bn" && hero.titleBn ? hero.titleBn : hero.title) : t("home.heroFallbackTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream-100/80 sm:text-lg">
              {hero
                ? lang === "bn" && hero.subtitleBn
                  ? hero.subtitleBn
                  : hero.subtitle || t("home.heroFallbackSubtitle")
                : t("home.heroFallbackSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={hero?.link || "/shop"} className="inline-flex items-center gap-2 rounded-full bg-cream-100 px-7 py-3.5 text-sm font-bold text-leaf-900 transition hover:bg-white">
                {t("home.shopNow")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                {t("nav.about")}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-cream-100/70">
              <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-cream-300" /> {lang === "bn" ? "যাচাইকৃত উৎস" : "Verified sourcing"}</span>
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-cream-300" /> {lang === "bn" ? "সারা দেশে ডেলিভারি" : "Nationwide delivery"}</span>
              <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-cream-300" /> {lang === "bn" ? "কীটনাশকমুক্ত" : "Pesticide-free options"}</span>
            </div>
          </div>

          {sideBanner && (
            <Link
              to={sideBanner.link || "/shop"}
              className="group relative hidden min-h-64 overflow-hidden rounded-[2rem] border border-white/20 lg:block"
            >
              <img src={sideBanner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-leaf-950/90 via-leaf-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <p className="font-display text-2xl text-white">{lang === "bn" && sideBanner.titleBn ? sideBanner.titleBn : sideBanner.title}</p>
                <p className="mt-1 text-sm text-cream-100/80">{lang === "bn" && sideBanner.subtitleBn ? sideBanner.subtitleBn : sideBanner.subtitle}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={lang === "bn" ? "আমাদের প্যান্ট্রি" : "Our pantry"}
          title={t("home.categories")}
          action={<Link to="/shop" className="hidden items-center gap-1 text-sm font-semibold text-leaf-700 hover:text-leaf-900 sm:flex">{t("common.viewAll")} <ArrowRight className="h-4 w-4" /></Link>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/shop?category=${category.slug}`}
              className={`group relative overflow-hidden rounded-2xl p-4 ${index === 0 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <div className="absolute inset-0 bg-cream-200 transition group-hover:bg-cream-300" />
              {category.imageUrl && (
                <img src={category.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-90" />
              )}
              <div className="relative flex aspect-square flex-col justify-end rounded-xl bg-gradient-to-t from-leaf-950/70 to-transparent p-3">
                <p className="text-sm font-semibold text-white">{pick(category, "name")}</p>
                <p className="text-[10px] text-cream-100/70">{category._count?.products || 0} {lang === "bn" ? "পণ্য" : "items"}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-cream-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={lang === "bn" ? "জনপ্রিয়" : "Loved by customers"}
            title={t("home.featured")}
            text={t("home.featuredSub")}
            action={<Link to="/shop?featured=1" className="btn-secondary">{t("common.viewAll")}</Link>}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[2rem]">
            <img
              src="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80"
              alt="Farmer working in a field"
              className="h-full min-h-80 w-full object-cover"
            />
            <div className="absolute bottom-5 left-5 max-w-xs rounded-2xl bg-cream-50/95 p-5 shadow-soft backdrop-blur">
              <p className="font-display text-xl text-leaf-900">{lang === "bn" ? "ছোট খামার, বড় যত্ন" : "Small farms, big care"}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                {lang === "bn" ? "প্রতিটি পণ্যের পেছনে পরিচিত কৃষক ও তাদের পরিশ্রম আছে।" : "Every product has a known grower and a story behind it."}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-600">{t("home.why")}</p>
            <h2 className="mt-3 font-display text-3xl text-stone-900 sm:text-4xl">{t("home.promoTitle")}</h2>
            <p className="mt-4 text-stone-500">{t("home.promoText")}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                { icon: Sprout, title: t("home.why1"), text: t("home.why1Text") },
                { icon: BadgeCheck, title: t("home.why2"), text: t("home.why2Text") },
                { icon: Truck, title: t("home.why3"), text: t("home.why3Text") },
                { icon: HeartHandshake, title: t("home.why4"), text: t("home.why4Text") },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-stone-200 bg-white p-5">
                  <item.icon className="h-6 w-6 text-leaf-600" />
                  <h3 className="mt-3 font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={lang === "bn" ? "সদ্য এসেছে" : "Just in"}
          title={t("home.newArrivals")}
          text={t("home.newArrivalsSub")}
          action={<Link to="/shop?sort=newest" className="hidden items-center gap-1 text-sm font-semibold text-leaf-700 hover:text-leaf-900 sm:flex">{t("common.viewAll")} <ArrowRight className="h-4 w-4" /></Link>}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </div>
  );
}
