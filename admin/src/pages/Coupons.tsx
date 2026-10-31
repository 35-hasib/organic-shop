import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, TicketPercent } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Coupon } from "../types";
import { date, money } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { EmptyState, ErrorState, Field, Loading, Modal, PageHeader } from "../components/ui";
import { Select } from "../components/Select";
import { useConfirm } from "../components/ConfirmModal";

interface FormState {
  code: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  perCustomerLimit: string;
  startsAt: string;
  expiresAt: string;
  active: boolean;
}

const empty: FormState = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "0",
  maxDiscount: "",
  usageLimit: "",
  perCustomerLimit: "1",
  startsAt: "",
  expiresAt: "",
  active: true,
};

export function Coupons() {
  const { show } = useToast();
  const { confirm, modal } = useConfirm();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ coupons: Coupon[] }>("/coupons");
      setCoupons(data.coupons);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const startEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount || "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      perCustomerLimit: String(coupon.perCustomerLimit),
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      active: coupon.active,
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        description: form.description || null,
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perCustomerLimit: Number(form.perCustomerLimit || 1),
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };
      if (editing) await api(`/coupons/${editing.id}`, { method: "PUT", body: payload });
      else await api("/coupons", { method: "POST", body: payload });
      show(editing ? "Coupon updated" : "Coupon created");
      setOpen(false);
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (coupon: Coupon) => {
    try {
      await api(`/coupons/${coupon.id}`, { method: "PUT", body: { active: !coupon.active } });
      show(coupon.active ? "Coupon disabled" : "Coupon enabled");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!(await confirm({ title: "Delete coupon", message: `Delete coupon "${coupon.code}"?` }))) return;
    try {
      await api(`/coupons/${coupon.id}`, { method: "DELETE" });
      show("Coupon removed");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Create offers that turn browsers into buyers." action={<button onClick={startCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add coupon</button>} />
      {loading ? <Loading /> : error ? <ErrorState message={error} /> : coupons.length === 0 ? (
        <EmptyState title="No coupons yet" text="Create a welcome offer or seasonal discount." action={<button onClick={startCreate} className="btn-primary">Create coupon</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((coupon) => (
            <article key={coupon.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700"><TicketPercent className="h-5 w-5" /></span>
                  <div>
                    <p className="font-mono text-base font-bold tracking-wide text-slate-900">{coupon.code}</p>
                    <p className="text-xs text-slate-400">{coupon.type === "PERCENTAGE" ? `${coupon.value}% off` : `${money(coupon.value)} off`}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coupon.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{coupon.active ? "Active" : "Off"}</span>
              </div>
              {coupon.description && <p className="mt-3 text-sm text-slate-600">{coupon.description}</p>}
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-slate-400">Minimum</dt><dd className="font-semibold text-slate-700">{money(coupon.minOrderAmount)}</dd></div>
                <div><dt className="text-slate-400">Max discount</dt><dd className="font-semibold text-slate-700">{coupon.maxDiscount ? money(coupon.maxDiscount) : "No cap"}</dd></div>
                <div><dt className="text-slate-400">Used</dt><dd className="font-semibold text-slate-700">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</dd></div>
                <div><dt className="text-slate-400">Per customer</dt><dd className="font-semibold text-slate-700">{coupon.perCustomerLimit}</dd></div>
                <div><dt className="text-slate-400">Starts</dt><dd className="font-semibold text-slate-700">{date(coupon.startsAt)}</dd></div>
                <div><dt className="text-slate-400">Expires</dt><dd className="font-semibold text-slate-700">{date(coupon.expiresAt)}</dd></div>
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <button onClick={() => toggle(coupon)} className="text-xs font-semibold text-slate-500 hover:text-leaf-700">{coupon.active ? "Disable" : "Enable"}</button>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(coupon)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-leaf-700"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(coupon)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <Modal title={editing ? "Edit coupon" : "Add coupon"} onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code"><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} required className="input font-mono" placeholder="ORGANIC10" /></Field>
              <Field label="Type">
                <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as FormState["type"] })} className="input">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed amount</option>
                </Select>
              </Field>
              <Field label={form.type === "PERCENTAGE" ? "Discount (%)" : "Discount (BDT)"}><input type="number" min="0.01" step="0.01" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} required className="input" /></Field>
              <Field label="Minimum order (BDT)"><input type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={(event) => setForm({ ...form, minOrderAmount: event.target.value })} className="input" /></Field>
              <Field label="Maximum discount (BDT)"><input type="number" min="0" step="0.01" value={form.maxDiscount} onChange={(event) => setForm({ ...form, maxDiscount: event.target.value })} className="input" placeholder="No cap" /></Field>
              <Field label="Total usage limit"><input type="number" min="1" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} className="input" placeholder="Unlimited" /></Field>
              <Field label="Per customer limit"><input type="number" min="1" value={form.perCustomerLimit} onChange={(event) => setForm({ ...form, perCustomerLimit: event.target.value })} className="input" /></Field>
              <Field label="Starts on"><input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className="input" /></Field>
              <Field label="Expires on"><input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="input" /></Field>
            </div>
            <Field label="Description"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} className="input" /></Field>
            <label className="flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-leaf-700" /> Active</label>
            <div className="flex gap-3 pt-1">
              <button disabled={busy} className="btn-primary flex-1">{busy ? "Saving..." : "Save coupon"}</button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    {modal}
</div>
  );
}
