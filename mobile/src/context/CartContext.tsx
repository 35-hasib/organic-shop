import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";
import type { Cart } from "../types";

interface CartValue extends Cart {
  loading: boolean;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const emptyCart: Cart = { items: [], count: 0, subtotal: "0.00" };
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }
    setLoading(true);
    try {
      const data = await api<Cart>("/cart", { auth: true });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => setCart(emptyCart));
  }, [user?.id]);

  const add = async (productId: string, quantity = 1) => {
    if (!user) throw new Error("Please sign in to add items to your cart");
    const data = await api<Cart>("/cart", { method: "POST", auth: true, body: { productId, quantity } });
    setCart(data);
  };

  const update = async (itemId: string, quantity: number) => {
    const data = await api<Cart>(`/cart/${itemId}`, { method: "PUT", auth: true, body: { quantity } });
    setCart(data);
  };

  const remove = async (itemId: string) => {
    const data = await api<Cart>(`/cart/${itemId}`, { method: "DELETE", auth: true });
    setCart(data);
  };

  const clear = async () => {
    const data = await api<Cart>("/cart", { method: "DELETE", auth: true });
    setCart(data);
  };

  const value = useMemo(
    () => ({ ...cart, loading, add, update, remove, clear, refresh }),
    [cart, loading, user?.id]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
