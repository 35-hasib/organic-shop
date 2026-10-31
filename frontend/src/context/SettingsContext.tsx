import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { Settings } from "../types";

const SettingsContext = createContext<Settings>({});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({});
  useEffect(() => {
    api<{ settings: Settings }>("/settings", { auth: false })
      .then((data) => setSettings(data.settings))
      .catch(() => undefined);
  }, []);
  const value = useMemo(() => settings, [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
