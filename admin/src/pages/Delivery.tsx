import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { DeliveryArea } from "../types";
import { money } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { EmptyState, ErrorState, Field, Loading, Modal, PageHeader } from "../components/ui";
import { useConfirm } from "../components/ConfirmModal";

interface FormState {
  name: string;
  nameBn: string;
  division: string;
  district: string;
  charge: string;
  freeDeliveryThreshold: string;
  active: boolean;
  sortOrder: string;
}

const empty: FormState = { name: "", nameBn: "", division: "", district: "", charge: "", freeDeliveryThreshold: "", active: true, sortOrder: "0" };

export function Delivery() {
  const { show } = useToast();
  const { confirm, modal } = useConfirm();
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<DeliveryArea | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ areas: DeliveryArea[] }>("/delivery-areas/admin");
      setAreas(data.areas);
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

  const startEdit = (area: DeliveryArea) => {
    setEditing(area);
    setForm({
      name: area.name,
      nameBn: area.nameBn,
      division: area.division,
      district: area.district,
      charge: area.charge,
      freeDeliveryThreshold: area.freeDeliveryThreshold || "",
      active: area.active,
      sortOrder: String(area.sortOrder),
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        charge: Number(form.charge),
        freeDeliveryThreshold: form.freeDeliveryThreshold ? Number(form.freeDeliveryThreshold) : null,
        sortOrder: Number(form.sortOrder),
      };
      if (editing) await api(`/delivery-areas/${editing.id}`, { method: "PUT", body: payload });
      else await api("/delivery-areas", { method: "POST", body: payload });
      show(editing ? "Delivery area updated" : "Delivery area added");
      setOpen(false);
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (area: DeliveryArea) => {
    try {
      await api(`/delivery-areas/${area.id}`, { method: "PUT", body: { active: !area.active } });
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const remove = async (area: DeliveryArea) => {
    if (!(await confirm({ title: "Delete delivery area", message: `Delete delivery area "${area.name}"?` }))) return;
    try {
      await api(`/delivery-areas/${area.id}`, { method: "DELETE" });
      show("Delivery area deleted");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Delivery areas" subtitle="Set charges and free-delivery thresholds by location." action={<button onClick={startCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add area</button>} />
      {loading ? <Loading /> : error ? <ErrorState message={error} /> : areas.length === 0 ? (
        <EmptyState title="No delivery areas" text="Add the districts and cities you deliver to." action={<button onClick={startCreate} className="btn-primary">Add area</button>} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Area</th>
                  <th className="px-5 py-3 font-semibold">Division</th>
                  <th className="px-5 py-3 font-semibold">District</th>
                  <th className="px-5 py-3 font-semibold">Charge</th>
                  <th className="px-5 py-3 font-semibold">Free over</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {areas.map((area) => (
                  <tr key={area.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-leaf-600" />
                        <div>
                          <p className="font-semibold text-slate-800">{area.name}</p>
                          <p className="text-xs text-slate-400">{area.nameBn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{area.division}</td>
                    <td className="px-5 py-3 text-slate-600">{area.district}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{money(area.charge)}</td>
                    <td className="px-5 py-3 text-slate-600">{area.freeDeliveryThreshold ? money(area.freeDeliveryThreshold) : "—"}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${area.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{area.active ? "Active" : "Inactive"}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggle(area)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">{area.active ? "Disable" : "Enable"}</button>
                        <button onClick={() => startEdit(area)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-leaf-700"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(area)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {open && (
        <Modal title={editing ? "Edit delivery area" : "Add delivery area"} onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Area name (English)"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="input" placeholder="Dhanmondi" /></Field>
              <Field label="Area name (Bangla)"><input value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} required className="input" /></Field>
              <Field label="Division"><input value={form.division} onChange={(event) => setForm({ ...form, division: event.target.value })} required className="input" placeholder="Dhaka" /></Field>
              <Field label="District"><input value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} required className="input" placeholder="Dhaka" /></Field>
              <Field label="Delivery charge (BDT)"><input type="number" min="0" step="0.01" value={form.charge} onChange={(event) => setForm({ ...form, charge: event.target.value })} required className="input" /></Field>
              <Field label="Free delivery over (BDT)"><input type="number" min="0" step="0.01" value={form.freeDeliveryThreshold} onChange={(event) => setForm({ ...form, freeDeliveryThreshold: event.target.value })} className="input" placeholder="Optional" /></Field>
              <Field label="Sort order"><input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="input" /></Field>
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-leaf-700" /> Available for delivery</label>
            <div className="flex gap-3 pt-1">
              <button disabled={busy} className="btn-primary flex-1">{busy ? "Saving..." : "Save area"}</button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    {modal}
</div>
  );
}
