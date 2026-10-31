import { NavLink, Outlet } from "react-router-dom";
import { Bell, Heart, MapPin, Package, User } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export function AccountLayout() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const links = [
    { to: "/account", end: true, label: t("account.profile"), icon: User },
    { to: "/account/orders", label: t("account.orders"), icon: Package },
    { to: "/account/addresses", label: t("account.addresses"), icon: MapPin },
    { to: "/account/notifications", label: t("account.notifications"), icon: Bell },
    { to: "/wishlist", label: t("nav.wishlist"), icon: Heart },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-stone-900">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-stone-500">{user?.name} · {user?.email || user?.phone}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 lg:flex-col lg:overflow-visible">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${isActive ? "bg-leaf-100 text-leaf-800" : "text-stone-600 hover:bg-cream-100"}`
                }
              >
                <link.icon className="h-4 w-4" /> {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
