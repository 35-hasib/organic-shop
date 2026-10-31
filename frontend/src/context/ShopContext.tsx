import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";
import type { Cart, Product } from "../types";

interface ShopValue {
  cart: Cart;
  wishlist: string[];
  wishlistItems: Product[];
  cartLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCart: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const emptyCart: Cart = { items: [], count: 0, subtotal: "0.00" };
const ShopContext = createContext<ShopValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [cartLoading, setCartLoading] = useState(false);

  const refreshCart = async () => {
    if (!user || user.role !== "CUSTOMER") {
      setCart(emptyCart);
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

  useEffect(() => {
    refreshCart();
    refreshWishlist().catch(() => undefined);
  }, [user?.id]);

  const addToCart = async (productId: string, quantity = 1) => {
    const next = await api<Cart>("/cart", { method: "POST", body: { productId, quantity } });
    setCart(next);
  };

  const updateCart = async (itemId: string, quantity: number) => {
    setCart(await api<Cart>(`/cart/${itemId}`, { method: "PUT", body: { quantity } }));
  };

  const removeItem = async (itemId: string) => {
    setCart(await api<Cart>(`/cart/${itemId}`, { method: "DELETE" }));
  };

  const clearCart = async () => {
    setCart(await api<Cart>("/cart", { method: "DELETE" }));
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
