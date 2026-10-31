import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type TranslationKey } from "../lib/translations";

type Lang = "en" | "bn";

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  pick: <T extends object>(row: T, field: string) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("organic_lang");
    return saved === "bn" ? "bn" : "en";
  });

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem("organic_lang", next);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      setLang,
      t: (key) => translations[key]?.[lang === "bn" ? 1 : 0] || key,
      pick: <T extends object>(row: T, field: string) => {
        const record = row as Record<string, unknown>;
        const localized = record[`${field}Bn`];
        const fallback = record[field];
        if (lang === "bn" && typeof localized === "string" && localized.trim()) return localized;
        return typeof fallback === "string" ? fallback : "";
      },
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
