import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Category } from "../types";
import { uploadImage } from "../lib/upload";
import { useToast } from "../context/ToastContext";
import { EmptyState, ErrorState, Field, Loading, Modal, PageHeader } from "../components/ui";
import { Select } from "../components/Select";
import { useConfirm } from "../components/ConfirmModal";

interface FormState {
  name: string;
  nameBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  imageUrl: string;
  parentId: string;
  active: boolean;
  sortOrder: string;
}

const empty: FormState = { name: "", nameBn: "", slug: "", description: "", descriptionBn: "", imageUrl: "", parentId: "", active: true, sortOrder: "0" };

export function Categories() {
  const { show } = useToast();
  const { confirm, modal } = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ categories: Category[] }>("/categories?flat=1&all=1");
      setCategories(data.categories);
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

  const startEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      nameBn: category.nameBn,
      slug: category.slug,
      description: category.description || "",
      descriptionBn: category.descriptionBn || "",
      imageUrl: category.imageUrl || "",
      parentId: category.parentId || "",
      active: category.active,
      sortOrder: String(category.sortOrder),
    });
    setOpen(true);
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "organic-shop/categories");
      setForm((current) => ({ ...current, imageUrl: url }));
      show("Image uploaded");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder),
        imageUrl: form.imageUrl || null,
        description: form.description || null,
        descriptionBn: form.descriptionBn || null,
      };
      if (editing) await api(`/categories/${editing.id}`, { method: "PUT", body: payload });
      else await api("/categories", { method: "POST", body: payload });
      show(editing ? "Category updated" : "Category created");
      setOpen(false);
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (category: Category) => {
    try {
      await api(`/categories/${category.id}`, { method: "PUT", body: { active: !category.active } });
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const remove = async (category: Category) => {
    if (!(await confirm({ title: "Delete category", message: `Delete category "${category.name}"?` }))) return;
    try {
      await api(`/categories/${category.id}`, { method: "DELETE" });
      show("Category deleted");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const parentName = (id?: string | null) => categories.find((category) => category.id === id)?.name || "—";

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organise products into a clear, browsable catalogue." action={<button onClick={startCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add category</button>} />
      {loading ? <Loading /> : error ? <ErrorState message={error} /> : categories.length === 0 ? (
        <EmptyState title="No categories yet" action={<button onClick={startCreate} className="btn-primary">Add category</button>} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Parent</th>
                  <th className="px-5 py-3 font-semibold">Products</th>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {category.imageUrl ? <img src={category.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-slate-100" />}
                        <div>
                          <p className="font-semibold text-slate-800">{category.name}</p>
                          <p className="text-xs text-slate-400">{category.nameBn} · /{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{parentName(category.parentId)}</td>
                    <td className="px-5 py-3 text-slate-600">{category._count?.products || 0}</td>
                    <td className="px-5 py-3 text-slate-600">{category.sortOrder}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${category.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{category.active ? "Active" : "Hidden"}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggle(category)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">{category.active ? "Hide" : "Show"}</button>
                        <button onClick={() => startEdit(category)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-leaf-700"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(category)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
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
        <Modal title={editing ? "Edit category" : "Add category"} onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (English)"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="input" /></Field>
              <Field label="Name (Bangla)"><input value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} required className="input" /></Field>
            </div>
            <Field label="Slug" hint="Leave blank to generate"><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="input" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Parent category">
                <Select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })} className="input">
                  <option value="">None</option>
                  {categories.filter((category) => category.id !== editing?.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </Field>
              <Field label="Sort order"><input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="input" /></Field>
            </div>
            <div className="flex items-center gap-3">
              <label className="btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload image"}
                <input type="file" accept="image/*" onChange={upload} className="hidden" disabled={uploading} />
              </label>
              {form.imageUrl && <img src={form.imageUrl} alt="" className="h-12 w-20 rounded-lg object-cover" />}
            </div>
            <Field label="Description (English)"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} className="input" /></Field>
            <Field label="Description (Bangla)"><textarea value={form.descriptionBn} onChange={(event) => setForm({ ...form, descriptionBn: event.target.value })} rows={2} className="input" /></Field>
            <label className="flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-leaf-700" /> Active on storefront</label>
            <div className="flex gap-3 pt-1">
              <button disabled={busy} className="btn-primary flex-1">{busy ? "Saving..." : "Save category"}</button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    {modal}
</div>
  );
}
