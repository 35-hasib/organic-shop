import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

export function Register() {
  const { t, lang } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/account";
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
      });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-4xl text-stone-900">{t("register.title")}</h1>
      <p className="mt-2 text-stone-500">{t("register.subtitle")}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label">{t("common.name")}</label>
          <input value={form.name} onChange={update("name")} required minLength={2} className="input" placeholder={lang === "bn" ? "আপনার নাম" : "Your name"} />
        </div>
        <div>
          <label className="label">{t("common.email")} <span className="font-normal text-stone-400">({t("common.optional")})</span></label>
          <input type="email" value={form.email} onChange={update("email")} className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">{t("common.phone")} <span className="font-normal text-stone-400">({t("common.optional")})</span></label>
          <input value={form.phone} onChange={update("phone")} className="input" placeholder="01XXXXXXXXX" />
        </div>
        <div>
          <label className="label">{t("common.password")}</label>
          <input type="password" value={form.password} onChange={update("password")} required minLength={6} className="input" placeholder={lang === "bn" ? "কমপক্ষে ৬ অক্ষর" : "At least 6 characters"} />
        </div>
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? t("common.loading") : t("register.submit")}</button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        {t("register.haveAccount")} <Link to={`/login${redirect !== "/account" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="font-semibold text-leaf-700 hover:text-leaf-900">{t("register.signIn")}</Link>
      </p>
    </div>
  );
}
