import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";
import type { Cart, Product } from "../types";

interface ShopValue {
  cart: Cart;
  wishlist: string[];
  wishlistItems: Product[];
  cartLoading: boolean;
  addToCart: (product: Product | string, quantity?: number) => Promise<void>;
  updateCart: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

interface GuestCartLine {
  product: Product;
  quantity: number;
}

const GUEST_CART_KEY = "organic_guest_cart";
const emptyCart: Cart = { items: [], count: 0, subtotal: "0.00" };
const ShopContext = createContext<ShopValue | null>(null);

function readGuestCart(): GuestCartLine[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line) => line?.product?.id && Number(line.quantity) > 0)
      .map((line) => ({
        product: line.product as Product,
        quantity: Math.max(1, Math.min(99, Math.floor(Number(line.quantity)))),
      }));
  } catch {
    return [];
  }
}

function writeGuestCart(lines: GuestCartLine[]) {
  if (lines.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
  else localStorage.removeItem(GUEST_CART_KEY);
}

function buildGuestCart(lines: GuestCartLine[]): Cart {
  let subtotal = 0;
  const items = lines.map((line) => {
    const unitPrice = Number(line.product.salePrice || line.product.effectivePrice || line.product.price || 0);
    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;
    return {
      id: line.product.id,
      quantity: line.quantity,
      unitPrice: unitPrice.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      product: line.product,
    };
  });
  return {
    items,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: subtotal.toFixed(2),
  };
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [cartLoading, setCartLoading] = useState(false);

  const loadGuestCart = async () => {
    const stored = readGuestCart();
    if (stored.length === 0) {
      setCart(emptyCart);
      return;
    }
    setCartLoading(true);
    try {
      const resolved = await Promise.all(
        stored.map(async (line) => {
          try {
            const data = await api<{ product: Product }>(`/products/${line.product.id}`, { auth: false });
            if (data.product.stock < 1) return null;
            return {
              product: data.product,
              quantity: Math.max(1, Math.min(line.quantity, data.product.stock, 99)),
            };
          } catch {
            return null;
          }
        })
      );
      const lines = resolved.filter((line): line is GuestCartLine => Boolean(line));
      writeGuestCart(lines);
      setCart(buildGuestCart(lines));
    } finally {
      setCartLoading(false);
    }
  };

  const refreshCart = async () => {
    if (!user || user.role !== "CUSTOMER") {
      await loadGuestCart();
      return;
    }
    setCartLoading(true);
    try {
      setCart(await api<Cart>("/cart"));
    } finally {
      setCartLoading(false);
    }
  };

  const refreshWishlist = async () => {
    if (!user || user.role !== "CUSTOMER") {
      setWishlist([]);
      setWishlistItems([]);
      return;
    }
    const data = await api<{ items: { product: Product }[] }>("/wishlist");
    setWishlist(data.items.map((item) => item.product.id));
    setWishlistItems(data.items.map((item) => item.product));
  };

  const mergeGuestCart = async () => {
    const lines = readGuestCart();
    if (lines.length === 0) return;
    try {
      const serverCart = await api<Cart>("/cart");
      for (const line of lines) {
        const existing = serverCart.items.find((item) => item.product.id === line.product.id);
        const quantity = Math.min((existing?.quantity || 0) + line.quantity, line.product.stock, 99);
        if (quantity > 0) {
          await api("/cart", { method: "POST", body: { productId: line.product.id, quantity } });
        }
      }
      writeGuestCart([]);
    } catch {
      // Keep the guest cart so it can be retried on the next sign-in.
    }
  };

  useEffect(() => {
    const load = async () => {
      if (user && user.role === "CUSTOMER") await mergeGuestCart();
      await refreshCart();
      await refreshWishlist().catch(() => undefined);
    };
    load();
  }, [user?.id]);

  const addToCart = async (productOrId: Product | string, quantity = 1) => {
    if (user && user.role === "CUSTOMER") {
      const productId = typeof productOrId === "string" ? productOrId : productOrId.id;
      setCart(await api<Cart>("/cart", { method: "POST", body: { productId, quantity } }));
      return;
    }
    const product =
      typeof productOrId === "string"
        ? (await api<{ product: Product }>(`/products/${productOrId}`, { auth: false })).product
        : productOrId;
    if (product.stock < 1) throw new Error("This product is out of stock");
    const lines = readGuestCart();
    const existing = lines.find((line) => line.product.id === product.id);
    const max = Math.min(product.stock, 99);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, max);
    } else {
      lines.push({ product, quantity: Math.min(Math.max(1, quantity), max) });
    }
    writeGuestCart(lines);
    setCart(buildGuestCart(lines));
  };

  const updateCart = async (itemId: string, quantity: number) => {
    if (user && user.role === "CUSTOMER") {
      setCart(await api<Cart>(`/cart/${itemId}`, { method: "PUT", body: { quantity } }));
      return;
    }
    const lines = readGuestCart();
    const line = lines.find((item) => item.product.id === itemId);
    if (!line) return;
    line.quantity = Math.max(1, Math.min(quantity, line.product.stock, 99));
    writeGuestCart(lines);
    setCart(buildGuestCart(lines));
  };

  const removeItem = async (itemId: string) => {
    if (user && user.role === "CUSTOMER") {
      setCart(await api<Cart>(`/cart/${itemId}`, { method: "DELETE" }));
      return;
    }
    const lines = readGuestCart().filter((line) => line.product.id !== itemId);
    writeGuestCart(lines);
    setCart(buildGuestCart(lines));
  };

  const clearCart = async () => {
    if (user && user.role === "CUSTOMER") {
      setCart(await api<Cart>("/cart", { method: "DELETE" }));
      return;
    }
    writeGuestCart([]);
    setCart(emptyCart);
  };

  const toggleWishlist = async (productId: string) => {
    const exists = wishlist.includes(productId);
    if (exists) {
      await api(`/wishlist/${productId}`, { method: "DELETE" });
    } else {
      await api("/wishlist", { method: "POST", body: { productId } });
    }
    await refreshWishlist();
    return !exists;
  };

  const value = useMemo<ShopValue>(
    () => ({
      cart,
      wishlist,
      wishlistItems,
      cartLoading,
      addToCart,
      updateCart,
      removeItem,
      clearCart,
      toggleWishlist,
      refreshCart,
      refreshWishlist,
    }),
    [cart, wishlist, wishlistItems, cartLoading]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
