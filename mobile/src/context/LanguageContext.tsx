import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "bn";

const en = {
  home: "Home",
  shop: "Shop",
  cart: "Cart",
  account: "Account",
  search: "Search products",
  categories: "Categories",
  featured: "Featured harvest",
  freshPicks: "Fresh picks",
  viewAll: "View all",
  add: "Add",
  addToCart: "Add to cart",
  added: "Added to cart",
  signIn: "Sign in",
  signUp: "Create account",
  signOut: "Sign out",
  emailOrPhone: "Email or mobile",
  password: "Password",
  name: "Full name",
  email: "Email",
  phone: "Mobile number",
  orders: "My orders",
  addresses: "Saved addresses",
  notifications: "Notifications",
  language: "Language",
  checkout: "Checkout",
  subtotal: "Subtotal",
  delivery: "Delivery",
  total: "Total",
  placeOrder: "Place order",
  emptyCart: "Your basket is empty",
  continueShopping: "Continue shopping",
  loginRequired: "Sign in to continue",
  quantity: "Quantity",
  description: "Description",
  all: "All",
  noProducts: "No products found",
  orderNow: "Order now",
} as const;

type Key = keyof typeof en;

const bn: Record<Key, string> = {
  home: "হোম",
  shop: "শপ",
  cart: "কার্ট",
  account: "অ্যাকাউন্ট",
  search: "পণ্য খুঁজুন",
  categories: "ক্যাটাগরি",
  featured: "নির্বাচিত পণ্য",
  freshPicks: "নতুন সংগ্রহ",
  viewAll: "সব দেখুন",
  add: "যোগ করুন",
  addToCart: "কার্টে যোগ করুন",
  added: "কার্টে যোগ হয়েছে",
  signIn: "সাইন ইন",
  signUp: "অ্যাকাউন্ট খুলুন",
  signOut: "সাইন আউট",
  emailOrPhone: "ইমেইল বা মোবাইল",
  password: "পাসওয়ার্ড",
  name: "পুরো নাম",
  email: "ইমেইল",
  phone: "মোবাইল নম্বর",
  orders: "আমার অর্ডার",
  addresses: "সংরক্ষিত ঠিকানা",
  notifications: "নোটিফিকেশন",
  language: "ভাষা",
  checkout: "চেকআউট",
  subtotal: "সাবটোটাল",
  delivery: "ডেলিভারি",
  total: "মোট",
  placeOrder: "অর্ডার করুন",
  emptyCart: "আপনার কার্ট খালি",
  continueShopping: "কেনাকাটা চালিয়ে যান",
  loginRequired: "চালিয়ে যেতে সাইন ইন করুন",
  quantity: "পরিমাণ",
  description: "বিবরণ",
  all: "সব",
  noProducts: "কোনো পণ্য পাওয়া যায়নি",
  orderNow: "এখনই অর্ডার করুন",
};

interface LanguageValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: Key) => string;
  pick: (english: string, bangla: string) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem("organic_lang").then((saved) => {
      if (saved === "bn" || saved === "en") setLanguageState(saved);
    });
  }, []);

  const setLanguage = (value: Language) => {
    setLanguageState(value);
    AsyncStorage.setItem("organic_lang", value);
  };

  const value = useMemo<LanguageValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => (language === "bn" ? bn[key] : en[key]),
      pick: (english, bangla) => (language === "bn" ? bangla : english),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
