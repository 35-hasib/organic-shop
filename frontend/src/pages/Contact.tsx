import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { PageHeader } from "../components/PageHeader";
import { useSeo } from "../lib/seo";

export function Contact() {
  const { t, lang } = useLanguage();
  const settings = useSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  useSeo({
    title: "Contact Organic Shop | Get in Touch",
    description: "Contact Organic Shop Bangladesh for help with organic food orders, product questions, delivery, payments or bulk enquiries. Call, email or send us a message.",
    canonicalPath: "/contact",
  });

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/contact", {
        method: "POST",
        auth: false,
        body: {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          subject: form.subject,
          message: form.message,
        },
      });
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const address = lang === "bn" && settings.storeAddressBn ? settings.storeAddressBn : settings.storeAddress;

  return (
    <div>
      <PageHeader title={t("contact.title")} subtitle={t("contact.subtitle")} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="hidden overflow-hidden rounded-3xl lg:block lg:col-span-2">
          <img src="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1400&q=80" alt="" className="h-56 w-full object-cover" />
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          {sent ? (
            <div className="rounded-2xl bg-leaf-50 p-6 text-center">
              <p className="font-display text-2xl text-leaf-900">{t("contact.sent")}</p>
              <button type="button" onClick={() => setSent(false)} className="btn-secondary mt-4">{lang === "bn" ? "আরেকটি বার্তা" : "Send another message"}</button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">{t("common.name")}</label><input value={form.name} onChange={update("name")} required className="input" /></div>
                <div><label className="label">{t("common.email")}</label><input type="email" value={form.email} onChange={update("email")} className="input" /></div>
                <div><label className="label">{t("common.phone")}</label><input value={form.phone} onChange={update("phone")} className="input" /></div>
                <div><label className="label">{t("contact.subject")}</label><input value={form.subject} onChange={update("subject")} required className="input" /></div>
              </div>
              <div className="mt-4"><label className="label">{t("contact.message")}</label><textarea value={form.message} onChange={update("message")} required minLength={5} rows={6} className="input" /></div>
              {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
              <button disabled={busy} className="btn-primary mt-5"><Send className="h-4 w-4" /> {busy ? t("common.loading") : t("contact.send")}</button>
            </>
          )}
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-leaf-900 p-6 text-cream-50">
            <h2 className="font-display text-2xl">{t("contact.visit")}</h2>
            <p className="mt-3 flex items-start gap-2 text-sm text-cream-100/80"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {address}</p>
            {settings.storePhone && <p className="mt-3 flex items-center gap-2 text-sm text-cream-100/80"><Phone className="h-4 w-4" /> {settings.storePhone}</p>}
            {settings.storeEmail && <p className="mt-3 flex items-center gap-2 text-sm text-cream-100/80"><Mail className="h-4 w-4" /> {settings.storeEmail}</p>}
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-display text-xl text-stone-900">{lang === "bn" ? "সহায়তার সময়" : "Support hours"}</h2>
            <p className="mt-2 text-sm text-stone-600">{lang === "bn" ? "২৪/৭ — সারাদিন, সারারাত" : "24/7 — All day, every day"}</p>
            <p className="mt-1 text-xs text-stone-500">{lang === "bn" ? "সবসময় খোলা।" : "Always open."}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
