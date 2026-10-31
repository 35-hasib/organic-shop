import { useState } from "react";
import type { Address } from "../types";
import { useLanguage } from "../context/LanguageContext";

const blank = {
  label: "Home",
  recipientName: "",
  phone: "",
  division: "Dhaka",
  district: "",
  area: "",
  addressLine: "",
  postalCode: "",
  isDefault: false,
};

export function AddressForm({
  initial,
  onSubmit,
  onCancel,
  busy,
}: {
  initial?: Address;
  onSubmit: (data: Partial<Address>) => Promise<void>;
  onCancel?: () => void;
  busy?: boolean;
}) {
  const { lang } = useLanguage();
  const [form, setForm] = useState({
    label: initial?.label || blank.label,
    recipientName: initial?.recipientName || blank.recipientName,
    phone: initial?.phone || blank.phone,
    division: initial?.division || blank.division,
    district: initial?.district || blank.district,
    area: initial?.area || blank.area,
    addressLine: initial?.addressLine || blank.addressLine,
    postalCode: initial?.postalCode || blank.postalCode,
    isDefault: initial?.isDefault || false,
  });
  const [error, setError] = useState("");

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save address");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{lang === "bn" ? "লেবেল" : "Label"}</label>
          <input value={form.label} onChange={update("label")} required className="input" placeholder="Home / Office" />
        </div>
        <div>
          <label className="label">{lang === "bn" ? "প্রাপকের নাম" : "Recipient name"}</label>
          <input value={form.recipientName} onChange={update("recipientName")} required className="input" />
        </div>
        <div>
          <label className="label">{lang === "bn" ? "মোবাইল নম্বর" : "Mobile number"}</label>
          <input value={form.phone} onChange={update("phone")} required className="input" placeholder="01XXXXXXXXX" />
        </div>
        <div>
          <label className="label">{lang === "bn" ? "বিভাগ" : "Division"}</label>
          <input value={form.division} onChange={update("division")} required className="input" />
        </div>
        <div>
          <label className="label">{lang === "bn" ? "জেলা" : "District"}</label>
          <input value={form.district} onChange={update("district")} required className="input" />
        </div>
        <div>
          <label className="label">{lang === "bn" ? "এলাকা" : "Area"}</label>
          <input value={form.area} onChange={update("area")} required className="input" />
        </div>
      </div>
      <div>
        <label className="label">{lang === "bn" ? "বিস্তারিত ঠিকানা" : "Full address"}</label>
        <input value={form.addressLine} onChange={update("addressLine")} required minLength={5} className="input" placeholder={lang === "bn" ? "বাড়ি, রোড, এলাকা" : "House, road, area"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{lang === "bn" ? "পোস্ট কোড" : "Postal code"}</label>
          <input value={form.postalCode} onChange={update("postalCode")} className="input" />
        </div>
        <label className="flex items-end gap-2 pb-3 text-sm text-stone-600">
          <input type="checkbox" checked={form.isDefault} onChange={update("isDefault")} className="h-4 w-4 rounded border-stone-300 text-leaf-700 focus:ring-leaf-500" />
          {lang === "bn" ? "ডিফল্ট ঠিকানা" : "Set as default"}
        </label>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button disabled={busy} className="btn-primary">{busy ? "..." : (lang === "bn" ? "সংরক্ষণ করুন" : "Save address")}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">{lang === "bn" ? "বাতিল" : "Cancel"}</button>}
      </div>
    </form>
  );
}
