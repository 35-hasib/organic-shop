import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "../lib/api";
import { disconnectSocket, refreshSocketAuth } from "../lib/socket";
import type { User } from "../types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);
const USER_KEY = "organic_admin_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!getToken()) {
        setLoading(false);
        setUser(null);
        return;
      }
      try {
        const data = await api<{ user: User }>("/auth/me");
        if (data.user.role !== "ADMIN") throw new Error("Admin access required");
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch {
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        disconnectSocket();
      } finally {
        setLoading(false);
      }
    };
    check();
    const onUnauthorized = () => {
      setUser(null);
      localStorage.removeItem(USER_KEY);
      disconnectSocket();
    };
    window.addEventListener("organic-admin:unauthorized", onUnauthorized);
    return () => window.removeEventListener("organic-admin:unauthorized", onUnauthorized);
  }, []);

  const login = async (identifier: string, password: string) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { identifier, password },
    });
    if (data.user.role !== "ADMIN") throw new Error("This account does not have admin access");
    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    refreshSocketAuth();
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    disconnectSocket();
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
