import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Address } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../components/ConfirmModal";
import { AddressForm } from "../components/AddressForm";
import { EmptyState, ErrorState, Loading } from "../components/Loading";

export function Addresses() {
  const { t, lang } = useLanguage();
  const { show } = useToast();
  const { confirm, modal } = useConfirm();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Address | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ addresses: Address[] }>("/addresses");
      setAddresses(data.addresses);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (data: Partial<Address>) => {
    setBusy(true);
    try {
      if (editing) await api(`/addresses/${editing.id}`, { method: "PUT", body: data });
      else await api("/addresses", { method: "POST", body: data });
      setEditing(null);
      setAdding(false);
      await load();
      show(lang === "bn" ? "ঠিকানা সংরক্ষিত হয়েছে" : "Address saved");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (address: Address) => {
    if (!(await confirm({ title: lang === "bn" ? "ঠিকানা মুছুন" : "Delete address", message: lang === "bn" ? "এই ঠিকানাটি মুছে ফেলবেন?" : "Delete this address?" }))) return;
    try {
      await api(`/addresses/${address.id}`, { method: "DELETE" });
      await load();
      show(lang === "bn" ? "ঠিকানা মুছে ফেলা হয়েছে" : "Address deleted");
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-stone-900">{t("account.addresses")}</h2>
        {!adding && !editing && (
          <button onClick={() => setAdding(true)} className="btn-primary"><Plus className="h-4 w-4" /> {t("account.addAddress")}</button>
        )}
      </div>

      {adding && <div className="mt-5"><AddressForm onSubmit={save} onCancel={() => setAdding(false)} busy={busy} /></div>}
      {editing && <div className="mt-5"><AddressForm initial={editing} onSubmit={save} onCancel={() => setEditing(null)} busy={busy} /></div>}

      {addresses.length === 0 && !adding ? (
        <div className="mt-5">
          <EmptyState title={t("account.addressesEmpty")} action={<button onClick={() => setAdding(true)} className="btn-primary">{t("account.addAddress")}</button>} />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-stone-900">{address.recipientName}</span>
                    <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">{address.label}</span>
                    {address.isDefault && <span className="text-[10px] font-semibold text-leaf-600">{t("account.default")}</span>}
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{address.addressLine}</p>
                  <p className="text-sm text-stone-600">{address.area}, {address.district}, {address.division} {address.postalCode}</p>
                  <p className="mt-1 text-xs text-stone-500">{address.phone}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-stone-100 pt-3">
                <button onClick={() => { setEditing(address); setAdding(false); }} className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-leaf-700"><Pencil className="h-3.5 w-3.5" /> {t("common.edit")}</button>
                <button onClick={() => remove(address)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    {modal}
</div>
  );
}
