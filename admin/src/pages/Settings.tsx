import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Settings as SettingsType } from "../types";
import { useToast } from "../context/ToastContext";
import { ErrorState, Field, Loading, PageHeader } from "../components/ui";

const storeFields: { key: string; label: string; placeholder?: string }[] = [
  { key: "storeName", label: "Store name (English)" },
  { key: "storeNameBn", label: "Store name (Bangla)" },
  { key: "storePhone", label: "Phone", placeholder: "01700000000" },
  { key: "storeEmail", label: "Email" },
  { key: "storeAddress", label: "Address (English)" },
  { key: "storeAddressBn", label: "Address (Bangla)" },
  { key: "facebook", label: "Facebook URL" },
  { key: "instagram", label: "Instagram URL" },
  { key: "whatsapp", label: "WhatsApp number" },
];

const contentFields: { key: string; label: string; long?: boolean }[] = [
  { key: "aboutUs", label: "About us (English)", long: true },
  { key: "aboutUsBn", label: "About us (Bangla)", long: true },
  { key: "deliveryInfo", label: "Delivery information (English)", long: true },
  { key: "deliveryInfoBn", label: "Delivery information (Bangla)", long: true },
  { key: "returnPolicy", label: "Return policy (English)", long: true },
  { key: "returnPolicyBn", label: "Return policy (Bangla)", long: true },
  { key: "privacyPolicy", label: "Privacy policy (English)", long: true },
  { key: "privacyPolicyBn", label: "Privacy policy (Bangla)", long: true },
  { key: "terms", label: "Terms and conditions (English)", long: true },
  { key: "termsBn", label: "Terms and conditions (Bangla)", long: true },
  { key: "faq", label: "FAQ (English, JSON)", long: true },
  { key: "faqBn", label: "FAQ (Bangla, JSON)", long: true },
];

const knownKeys = new Set([...storeFields.map((field) => field.key), ...contentFields.map((field) => field.key)]);

export function Settings() {
  const { show } = useToast();
  const [settings, setSettings] = useState<SettingsType>({});
  const [extraKeys, setExtraKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ settings: SettingsType }>("/settings/admin");
      setSettings(data.settings);
      setExtraKeys(Object.keys(data.settings).filter((key) => !knownKeys.has(key)));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key: string, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api<{ settings: SettingsType }>("/settings", { method: "PUT", body: settings });
      setSettings(data.settings);
      show("Settings saved");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store identity, contact details and customer-facing policies." />

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-bold text-slate-900">Store profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {storeFields.map((field) => (
              <Field key={field.key} label={field.label}>
                <input value={settings[field.key] || ""} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} className="input" />
              </Field>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-bold text-slate-900">Store content</h2>
          <p className="mt-1 text-xs text-slate-400">These details appear on customer information pages.</p>
          <div className="mt-4 grid gap-4">
            {contentFields.map((field) => (
              <Field key={field.key} label={field.label}>
                {field.long ? (
                  <textarea value={settings[field.key] || ""} onChange={(event) => update(field.key, event.target.value)} rows={field.key.startsWith("faq") ? 5 : 3} className="input font-mono text-xs" />
                ) : (
                  <input value={settings[field.key] || ""} onChange={(event) => update(field.key, event.target.value)} className="input" />
                )}
              </Field>
            ))}
          </div>
        </section>

        {extraKeys.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Other settings</h2>
            <div className="mt-4 grid gap-4">
              {extraKeys.map((key) => (
                <Field key={key} label={key}>
                  <input value={settings[key] || ""} onChange={(event) => update(key, event.target.value)} className="input" />
                </Field>
              ))}
            </div>
          </section>
        )}

        <div className="sticky bottom-4 flex justify-end">
          <button disabled={busy} className="btn-primary shadow-lg"><Save className="h-4 w-4" /> {busy ? "Saving..." : "Save settings"}</button>
        </div>
      </form>
    </div>
  );
}
