import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Leaf, LockKeyhole, Mail } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

export function Login() {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const redirect = params.get("redirect") || "/account";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(identifier, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-120px)] lg:grid-cols-2">
      <div className="hidden bg-leaf-950 lg:block">
        <div className="relative h-full">
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80" alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-leaf-950 via-transparent to-transparent p-12 text-cream-50">
            <Leaf className="h-9 w-9" />
            <p className="mt-5 max-w-lg font-display text-4xl leading-tight">{lang === "bn" ? "আপনার পরিবারের জন্য খাঁটি খাবার।" : "Honest food for the people you love."}</p>
            <p className="mt-3 max-w-md text-sm text-cream-100/70">{lang === "bn" ? "অর্ডার ট্র্যাক করুন, ঠিকানা সংরক্ষণ করুন এবং পছন্দের পণ্য দ্রুত কিনুন।" : "Track orders, save addresses and shop your favourites faster."}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl text-stone-900">{t("login.title")}</h1>
          <p className="mt-2 text-stone-500">{t("login.subtitle")}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">{t("login.identifier")}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} required className="input pl-11" placeholder="you@example.com" autoComplete="username" />
              </div>
            </div>
            <div>
              <label className="label">{t("common.password")}</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="input pl-11" placeholder="••••••••" autoComplete="current-password" />
              </div>
            </div>
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            <button disabled={busy} className="btn-primary w-full">{busy ? t("common.loading") : t("login.submit")}</button>
          </form>
          <p className="mt-6 text-center text-sm text-stone-500">
            {t("login.noAccount")} <Link to={`/register${redirect !== "/account" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="font-semibold text-leaf-700 hover:text-leaf-900">{t("login.create")}</Link>
          </p>
          {/* <div className="mt-8 rounded-2xl border border-stone-200 bg-cream-100 p-4 text-xs text-stone-500">
            <p className="font-semibold text-stone-700">{lang === "bn" ? "ডেমো অ্যাকাউন্ট" : "Demo account"}</p>
            <p className="mt-1">customer@organic.test / Customer123!</p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
