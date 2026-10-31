import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole, optionalAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { uniqueSlug } from "../lib/slugs.js";
import { serializeDecimals } from "../lib/serialize.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const includeInactive = req.user?.role === "ADMIN" && req.query.all === "1";
    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    if (req.query.flat === "1") return res.json({ categories: serializeDecimals(categories) });
    const map = new Map(categories.map((c) => [c.id, { ...c, children: [] }]));
    const roots = [];
    for (const category of map.values()) {
      if (category.parentId && map.has(category.parentId)) {
        map.get(category.parentId).children.push(category);
      } else {
        roots.push(category);
      }
    }
    res.json({ categories: serializeDecimals(roots) });
  })
);

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  nameBn: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  descriptionBn: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
  parentId: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

router.post(
  "/",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
    if (parsed.data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId } });
      if (!parent) throw new HttpError(400, "Parent category not found");
    }
    const slug = parsed.data.slug
      ? await uniqueSlug(prisma, "category", parsed.data.slug)
      : await uniqueSlug(prisma, "category", parsed.data.name);
    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        slug,
        imageUrl: parsed.data.imageUrl || null,
        description: parsed.data.description || null,
        descriptionBn: parsed.data.descriptionBn || null,
      },
    });
    res.status(201).json({ category: serializeDecimals(category) });
  })
);

router.put(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Category not found");
    if (parsed.data.parentId === req.params.id) throw new HttpError(400, "A category cannot contain itself");
    const data = { ...parsed.data };
    if (parsed.data.slug) data.slug = await uniqueSlug(prisma, "category", parsed.data.slug, req.params.id);
    if (parsed.data.name && !parsed.data.slug) {
      data.slug = await uniqueSlug(prisma, "category", parsed.data.name, req.params.id);
    }
    if (parsed.data.imageUrl === "") data.imageUrl = null;
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json({ category: serializeDecimals(category) });
  })
);

router.delete(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const [products, children] = await Promise.all([
      prisma.product.count({ where: { categoryId: req.params.id } }),
      prisma.category.count({ where: { parentId: req.params.id } }),
    ]);
    if (products > 0) throw new HttpError(409, "Move or delete products in this category first");
    if (children > 0) throw new HttpError(409, "Delete or move subcategories first");
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
