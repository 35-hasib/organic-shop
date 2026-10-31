import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, loadStoredToken, setAuthToken, setUnauthorizedHandler } from "../lib/api";
import type { User } from "../types";

const USER_KEY = "organic_user";

interface RegisterInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const saved = await AsyncStorage.getItem(USER_KEY);
      if (saved) {
        try {
          setUser(JSON.parse(saved) as User);
        } catch {
          await AsyncStorage.removeItem(USER_KEY);
        }
      }
      await loadStoredToken();
      try {
        const data = await api<{ user: User }>("/auth/me", { auth: true });
        setUser(data.user);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch {
        await setAuthToken(null);
        await AsyncStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
    setUnauthorizedHandler(() => {
      setUser(null);
      AsyncStorage.removeItem(USER_KEY);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (identifier: string, password: string) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
    if (data.user.role !== "CUSTOMER") throw new Error("Please use a customer account");
    await setAuthToken(data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (input: RegisterInput) => {
    const data = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: input,
    });
    await setAuthToken(data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await setAuthToken(null);
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
