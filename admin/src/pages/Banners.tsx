import { useEffect, useState } from "react";
import { Image, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { uploadImage } from "../lib/upload";
import type { Banner } from "../types";
import { useToast } from "../context/ToastContext";
import { EmptyState, ErrorState, Field, Loading, Modal, PageHeader } from "../components/ui";
import { useConfirm } from "../components/ConfirmModal";

interface FormState {
  title: string;
  titleBn: string;
  subtitle: string;
  subtitleBn: string;
  imageUrl: string;
  link: string;
  sortOrder: string;
  active: boolean;
}

const empty: FormState = { title: "", titleBn: "", subtitle: "", subtitleBn: "", imageUrl: "", link: "", sortOrder: "0", active: true };

export function Banners() {
  const { show } = useToast();
  const { confirm, modal } = useConfirm();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ banners: Banner[] }>("/banners/admin");
      setBanners(data.banners);
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

  const startEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      titleBn: banner.titleBn,
      subtitle: banner.subtitle || "",
      subtitleBn: banner.subtitleBn || "",
      imageUrl: banner.imageUrl,
      link: banner.link || "",
      sortOrder: String(banner.sortOrder),
      active: banner.active,
    });
    setOpen(true);
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
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
        subtitle: form.subtitle || null,
        subtitleBn: form.subtitleBn || null,
        link: form.link || null,
        sortOrder: Number(form.sortOrder),
      };
      if (editing) await api(`/banners/${editing.id}`, { method: "PUT", body: payload });
      else await api("/banners", { method: "POST", body: payload });
      show(editing ? "Banner updated" : "Banner created");
      setOpen(false);
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (banner: Banner) => {
    try {
      await api(`/banners/${banner.id}`, { method: "PUT", body: { active: !banner.active } });
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const remove = async (banner: Banner) => {
    if (!(await confirm({ title: "Delete banner", message: `Delete banner "${banner.title}"?` }))) return;
    try {
      await api(`/banners/${banner.id}`, { method: "DELETE" });
      show("Banner deleted");
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Banners" subtitle="Control the hero messages shown on your storefront." action={<button onClick={startCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add banner</button>} />
      {loading ? <Loading /> : error ? <ErrorState message={error} /> : banners.length === 0 ? (
        <EmptyState title="No banners yet" text="Add a hero image and message to promote seasonal offers." action={<button onClick={startCreate} className="btn-primary">Add banner</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <article key={banner.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title} className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400"><Image className="h-8 w-8" /></div>}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">{banner.title}</h2>
                    <p className="text-sm text-slate-500">{banner.titleBn}</p>
                    {banner.subtitle && <p className="mt-1 text-sm text-slate-600">{banner.subtitle}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${banner.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{banner.active ? "Active" : "Hidden"}</span>
                </div>
                {banner.link && <p className="mt-2 truncate text-xs text-slate-400">{banner.link}</p>}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button onClick={() => toggle(banner)} className="text-xs font-semibold text-slate-500 hover:text-leaf-700">{banner.active ? "Hide" : "Show"}</button>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(banner)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-leaf-700"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(banner)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <Modal title={editing ? "Edit banner" : "Add banner"} onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title (English)"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="input" /></Field>
              <Field label="Title (Bangla)"><input value={form.titleBn} onChange={(event) => setForm({ ...form, titleBn: event.target.value })} required className="input" /></Field>
              <Field label="Subtitle (English)"><input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} className="input" /></Field>
              <Field label="Subtitle (Bangla)"><input value={form.subtitleBn} onChange={(event) => setForm({ ...form, subtitleBn: event.target.value })} className="input" /></Field>
            </div>
            <div className="flex items-center gap-3">
              <label className="btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload image"}
                <input type="file" accept="image/*" onChange={upload} className="hidden" disabled={uploading} />
              </label>
              {form.imageUrl && <img src={form.imageUrl} alt="" className="h-12 w-20 rounded-lg object-cover" />}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link"><input value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} className="input" placeholder="/shop?category=..." /></Field>
              <Field label="Sort order"><input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="input" /></Field>
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-leaf-700" /> Active on storefront</label>
            <div className="flex gap-3 pt-1">
              <button disabled={busy} className="btn-primary flex-1">{busy ? "Saving..." : "Save banner"}</button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    {modal}
</div>
  );
}
