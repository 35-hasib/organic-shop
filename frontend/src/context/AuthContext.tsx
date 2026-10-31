import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "../lib/api";
import type { User } from "../types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (payload: { name: string; email?: string; phone?: string; password: string }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const onUnauthorized = () => setUser(null);
    window.addEventListener("organic:unauthorized", onUnauthorized);
    return () => window.removeEventListener("organic:unauthorized", onUnauthorized);
  }, []);

  const login = async (identifier: string, password: string) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { identifier, password },
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload: { name: string; email?: string; phone?: string; password: string }) => {
    const data = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      auth: false,
      body: payload,
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("organic_cart_loaded");
  };

  const value = useMemo<AuthValue>(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
