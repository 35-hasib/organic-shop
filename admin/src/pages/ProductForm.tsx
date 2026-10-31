import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Trash2, Upload } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { uploadImage } from "../lib/upload";
import type { Category, Product } from "../types";
import { useToast } from "../context/ToastContext";
import { ErrorState, Field, Loading, PageHeader } from "../components/ui";
import { Select } from "../components/Select";

interface FormState {
  name: string;
  nameBn: string;
  slug: string;
  sku: string;
  categoryId: string;
  price: string;
  salePrice: string;
  unit: string;
  stock: string;
  lowStockThreshold: string;
  description: string;
  descriptionBn: string;
  ingredients: string;
  ingredientsBn: string;
  origin: string;
  originBn: string;
  storageInstructions: string;
  storageInstructionsBn: string;
  certification: string;
  certificationBn: string;
  published: boolean;
  featured: boolean;
}

const empty: FormState = {
  name: "",
  nameBn: "",
  slug: "",
  sku: "",
  categoryId: "",
  price: "",
  salePrice: "",
  unit: "",
  stock: "0",
  lowStockThreshold: "10",
  description: "",
  descriptionBn: "",
  ingredients: "",
  ingredientsBn: "",
  origin: "",
  originBn: "",
  storageInstructions: "",
  storageInstructionsBn: "",
  certification: "",
  certificationBn: "",
  published: true,
  featured: false,
};

export function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const categoryData = await api<{ categories: Category[] }>("/categories?flat=1&all=1");
        setCategories(categoryData.categories);
        if (id) {
          const data = await api<{ product: Product }>(`/products/${id}`);
          const product = data.product;
          setForm({
            name: product.name,
            nameBn: product.nameBn,
            slug: product.slug,
            sku: product.sku,
            categoryId: product.categoryId,
            price: product.price,
            salePrice: product.salePrice || "",
            unit: product.unit,
            stock: String(product.stock),
            lowStockThreshold: String(product.lowStockThreshold),
            description: product.description,
            descriptionBn: product.descriptionBn,
            ingredients: product.ingredients || "",
            ingredientsBn: product.ingredientsBn || "",
            origin: product.origin || "",
            originBn: product.originBn || "",
            storageInstructions: product.storageInstructions || "",
            storageInstructionsBn: product.storageInstructionsBn || "",
            certification: product.certification || "",
            certificationBn: product.certificationBn || "",
            published: product.published,
            featured: product.featured,
          });
          setImages(product.images || []);
        } else {
          setForm((current) => ({ ...current, categoryId: categoryData.categories[0]?.id || "" }));
        }
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [id]);

  const update = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImages((current) => [...current, url]);
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
    setError("");
    try {
      const payload = {
        ...form,
        sku: form.sku || undefined,
        slug: form.slug || undefined,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        images,
        ingredients: form.ingredients || null,
        ingredientsBn: form.ingredientsBn || null,
        origin: form.origin || null,
        originBn: form.originBn || null,
        storageInstructions: form.storageInstructions || null,
        storageInstructionsBn: form.storageInstructionsBn || null,
        certification: form.certification || null,
        certificationBn: form.certificationBn || null,
      };
      if (id) await api(`/products/${id}`, { method: "PUT", body: payload });
      else await api("/products", { method: "POST", body: payload });
      show(editing ? "Product updated" : "Product created");
      navigate("/products");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <Link to="/products" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-leaf-700"><ArrowLeft className="h-4 w-4" /> Products</Link>
      <PageHeader title={editing ? "Edit product" : "Add product"} subtitle={editing ? "Update details, pricing and availability." : "Create a new product for your storefront."} />
      {error && <div className="mb-4"><ErrorState message={error} /></div>}

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Basic information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Name (English)"><input value={form.name} onChange={update("name")} required className="input" /></Field>
              <Field label="Name (Bangla)"><input value={form.nameBn} onChange={update("nameBn")} required className="input" /></Field>
              <Field label="Slug" hint="Leave blank to generate from name"><input value={form.slug} onChange={update("slug")} className="input" placeholder="sundarban-raw-honey" /></Field>
              <Field label="SKU" hint="Leave blank to auto-generate"><input value={form.sku} onChange={update("sku")} className="input" /></Field>
              <Field label="Category">
                <Select value={form.categoryId} onChange={update("categoryId")} required className="input">
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </Field>
              <Field label="Unit"><input value={form.unit} onChange={update("unit")} required className="input" placeholder="500 gm, 1 kg, 1 litre" /></Field>
              <div className="sm:col-span-2">
                <Field label="Description (English)"><textarea value={form.description} onChange={update("description")} required rows={4} className="input" /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description (Bangla)"><textarea value={form.descriptionBn} onChange={update("descriptionBn")} required rows={4} className="input" /></Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Ingredients (English)"><input value={form.ingredients} onChange={update("ingredients")} className="input" /></Field>
              <Field label="Ingredients (Bangla)"><input value={form.ingredientsBn} onChange={update("ingredientsBn")} className="input" /></Field>
              <Field label="Origin (English)"><input value={form.origin} onChange={update("origin")} className="input" /></Field>
              <Field label="Origin (Bangla)"><input value={form.originBn} onChange={update("originBn")} className="input" /></Field>
              <Field label="Storage (English)"><input value={form.storageInstructions} onChange={update("storageInstructions")} className="input" /></Field>
              <Field label="Storage (Bangla)"><input value={form.storageInstructionsBn} onChange={update("storageInstructionsBn")} className="input" /></Field>
              <Field label="Quality note (English)"><input value={form.certification} onChange={update("certification")} className="input" /></Field>
              <Field label="Quality note (Bangla)"><input value={form.certificationBn} onChange={update("certificationBn")} className="input" /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Images</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {images.map((image, index) => (
                <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200">
                  <img src={image} alt="" className="h-36 w-full object-cover" />
                  <button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-rose-600 shadow-sm hover:bg-white" aria-label="Remove image">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {images.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">No images added yet.</p>}
            </div>
            <div className="mt-4">
              <label className="btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload image"}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-400">Uploads require Cloudinary credentials in the backend environment.</p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Pricing & stock</h2>
            <div className="mt-4 space-y-4">
              <Field label="Regular price (BDT)"><input type="number" step="0.01" min="1" value={form.price} onChange={update("price")} required className="input" /></Field>
              <Field label="Sale price (BDT)" hint="Leave blank for no sale"><input type="number" step="0.01" min="1" value={form.salePrice} onChange={update("salePrice")} className="input" /></Field>
              <Field label="Stock"><input type="number" min="0" value={form.stock} onChange={update("stock")} required className="input" /></Field>
              <Field label="Low stock threshold"><input type="number" min="0" value={form.lowStockThreshold} onChange={update("lowStockThreshold")} className="input" /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="font-bold text-slate-900">Visibility</h2>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.published} onChange={update("published")} className="h-4 w-4 rounded border-slate-300 text-leaf-700 focus:ring-leaf-500" />
                Published on storefront
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.featured} onChange={update("featured")} className="h-4 w-4 rounded border-slate-300 text-leaf-700 focus:ring-leaf-500" />
                Featured product
              </label>
            </div>
          </section>

          <button disabled={busy} className="btn-primary w-full">{busy ? "Saving..." : editing ? "Save changes" : "Create product"}</button>
          <Link to="/products" className="btn-secondary w-full">Cancel</Link>
        </aside>
      </form>
    </div>
  );
}
