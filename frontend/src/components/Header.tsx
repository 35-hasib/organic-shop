import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, Globe, Heart, Leaf, LogOut, Menu, Package, Search, ShoppingBag, User, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { useSettings } from "../context/SettingsContext";

const navItems: { to: string; key: "nav.home" | "nav.shop" | "nav.about" | "nav.contact" }[] = [
  { to: "/", key: "nav.home" },
  { to: "/shop", key: "nav.shop" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
];

export function Header() {
  const { t, lang, setLang, pick } = useLanguage();
  const { user, logout } = useAuth();
  const { cart } = useShop();
  const settings = useSettings();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setOpen(false);
    navigate(search.trim() ? `/shop?q=${encodeURIComponent(search.trim())}` : "/shop");
  };

  const storeName = lang === "bn" && settings.storeNameBn ? settings.storeNameBn : settings.storeName || "Organic Shop";

  return (
    <>
      <div className="bg-leaf-950 text-cream-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] sm:px-6 lg:px-8">
          <p>{t("announcement.left")}</p>
          <p className="hidden sm:block">{t("announcement.right")}</p>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6 text-stone-700" />
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-cream-50">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="truncate font-display text-xl font-semibold tracking-tight text-leaf-900 sm:text-2xl">{storeName}</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${isActive ? "text-leaf-700" : "text-stone-600 hover:text-leaf-700"}`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 items-center rounded-full border border-stone-300 bg-white px-4 md:flex">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("common.search")}
              className="w-full border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-stone-400"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="hidden items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-cream-200 sm:flex"
              title="Change language"
            >
              <Globe className="h-4 w-4" />
              {lang === "en" ? "বাংলা" : "EN"}
            </button>
            <Link to="/wishlist" className="relative rounded-full p-2.5 text-stone-600 hover:bg-cream-200" aria-label={t("nav.wishlist")}>
              <Heart className="h-5 w-5" />
            </Link>
            <Link to="/cart" className="relative rounded-full p-2.5 text-stone-600 hover:bg-cream-200" aria-label={t("nav.cart")}>
              <ShoppingBag className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-white">
                  {cart.count}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((value) => !value)}
                  className="flex items-center gap-1 rounded-full p-2.5 text-stone-600 hover:bg-cream-200"
                  aria-label={t("nav.account")}
                >
                  <User className="h-5 w-5" />
                  <ChevronDown className="hidden h-3 w-3 sm:block" />
                </button>
                {accountOpen && (
                  <>
                    <button className="fixed inset-0 z-10 cursor-default" onClick={() => setAccountOpen(false)} aria-label="Close menu" />
                    <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-soft">
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold text-stone-800">{user.name}</p>
                        <p className="truncate text-xs text-stone-500">{user.email || user.phone}</p>
                      </div>
                      <Link to="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-stone-600 hover:bg-cream-100">
                        <User className="h-4 w-4" /> {t("account.profile")}
                      </Link>
                      <Link to="/account/orders" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-stone-600 hover:bg-cream-100">
                        <Package className="h-4 w-4" /> {t("account.orders")}
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setAccountOpen(false);
                          navigate("/");
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-stone-600 hover:bg-cream-100"
                      >
                        <LogOut className="h-4 w-4" /> {t("nav.logout")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="ml-1 hidden rounded-full bg-leaf-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800 sm:block">
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-cream-50 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl text-leaf-900">{storeName}</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={submitSearch} className="mt-6 flex items-center rounded-full border border-stone-300 bg-white px-4">
              <Search className="h-4 w-4 text-stone-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("common.search")}
                className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
              />
            </form>
            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-stone-700 hover:bg-cream-200"
                >
                  {t(item.key)}
                </NavLink>
              ))}
              <NavLink to="/account/orders" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-stone-700 hover:bg-cream-200">
                {t("account.orders")}
              </NavLink>
              <NavLink to="/wishlist" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-stone-700 hover:bg-cream-200">
                {t("nav.wishlist")}
              </NavLink>
            </nav>
            <div className="mt-auto space-y-3 border-t border-stone-200 pt-6">
              <button
                onClick={() => setLang(lang === "en" ? "bn" : "en")}
                className="flex w-full items-center justify-between rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium"
              >
                <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> {lang === "en" ? "বাংলা" : "English"}</span>
                <span>{lang === "en" ? "BN" : "EN"}</span>
              </button>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                    navigate("/");
                  }}
                  className="btn-primary w-full"
                >
                  {t("nav.logout")}
                </button>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="btn-primary w-full">
                  {t("nav.login")}
                </Link>
              )}
              <p className="pt-2 text-xs text-stone-500">{settings.storePhone}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
