import { slugify } from "./serialize.js";

export async function uniqueSlug(prisma, model, value, excludeId) {
  const base = slugify(value) || "item";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const found = await prisma[model].findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!found) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export async function uniqueSku(prisma, value, excludeId) {
  const base = (value || `SKU-${Date.now().toString(36).toUpperCase()}`).trim().toUpperCase();
  let candidate = base;
  let suffix = 2;
  while (true) {
    const found = await prisma.product.findFirst({
      where: { sku: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!found) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}
