import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { api, errorMessage } from "../lib/api";

export function Profile() {
  const { user, setUser } = useAuth();
  const { lang, t } = useLanguage();
  const { show } = useToast();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body: Record<string, string | null> = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
      };
      if (form.password) body.password = form.password;
      const data = await api<{ user: NonNullable<typeof user> }>("/auth/me", { method: "PUT", body });
      setUser(data.user);
      setForm((current) => ({ ...current, password: "" }));
      show(lang === "bn" ? "প্রোফাইল হালনাগাদ হয়েছে" : "Profile updated");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl text-stone-900">{t("account.profile")}</h2>
      <p className="mt-1 text-sm text-stone-500">{lang === "bn" ? "আপনার যোগাযোগের তথ্য হালনাগাদ করুন।" : "Keep your contact details up to date."}</p>
      <form onSubmit={submit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label className="label">{t("common.name")}</label>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("common.email")}</label>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input" />
          </div>
          <div>
            <label className="label">{t("common.phone")}</label>
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input" />
          </div>
        </div>
        <div>
          <label className="label">{lang === "bn" ? "নতুন পাসওয়ার্ড" : "New password"} <span className="font-normal text-stone-400">({t("common.optional")})</span></label>
          <input type="password" minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="input" placeholder={lang === "bn" ? "পরিবর্তন না করতে খালি রাখুন" : "Leave blank to keep current password"} />
        </div>
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary">{busy ? t("common.loading") : t("common.save")}</button>
      </form>
    </div>
  );
}
