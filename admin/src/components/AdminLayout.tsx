import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  CreditCard,
  Image,
  LayoutDashboard,
  Leaf,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/coupons", label: "Coupons", icon: CreditCard },
  { to: "/delivery", label: "Delivery areas", icon: Truck },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/banners", label: "Banners", icon: Image },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/messages", label: "Messages", icon: Mail },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-500 text-white"><Leaf className="h-5 w-5" /></span>
        <div>
          <p className="text-sm font-bold text-white">Organic Shop</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-leaf-300">Admin panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`
            }
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-700 text-sm font-bold text-white">{user?.name?.charAt(0) || "A"}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-leaf-950 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-leaf-950">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
          <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-slate-700 lg:hidden"><ChevronLeft className="h-4 w-4" /> Dashboard</Link>
          <div className="ml-auto flex items-center gap-3">
            <a href="https://organic-shop-two.vercel.app" target="_blank" rel="noreferrer" className="hidden rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:block">View store</a>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-100 text-xs font-bold text-leaf-800">{user?.name?.charAt(0) || "A"}</span>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
