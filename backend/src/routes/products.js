import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole, optionalAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError, pagination } from "../lib/http.js";
import { serializeDecimals } from "../lib/serialize.js";
import { uniqueSku, uniqueSlug } from "../lib/slugs.js";
import { money, parseMoney } from "../lib/money.js";

const router = Router();

async function categoryWithChildren(categoryId) {
  const rows = await prisma.$queryRawUnsafe(
    `WITH RECURSIVE tree AS (
       SELECT id FROM categories WHERE id = $1::uuid
       UNION ALL
       SELECT c.id FROM categories c JOIN tree t ON c.parent_id = t.id
     ) SELECT id FROM tree`,
    categoryId
  );
  return rows.map((row) => row.id);
}

function ratingFor(product) {
  const reviews = product.reviews || [];
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;
  return { ratingAverage: Number(average.toFixed(1)), reviewCount: count };
}

function presentProduct(product) {
  const { reviews, ...rest } = product;
  return serializeDecimals({
    ...rest,
    reviews: reviews || [],
    ...ratingFor(product),
    effectivePrice: product.salePrice !== null ? product.salePrice : product.price,
    inStock: product.stock > 0,
  });
}

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const isAdmin = req.user?.role === "ADMIN" && req.query.all === "1";
    const { page, pageSize, skip, take } = pagination(req.query, { pageSize: 12 });
    const where = {};
    if (!isAdmin) where.published = true;
    if (isAdmin && req.query.published === "0") where.published = false;
    if (isAdmin && req.query.published === "1") where.published = true;
    if (req.query.category) {
      const category = /^[0-9a-f-]{36}$/i.test(req.query.category)
        ? await prisma.category.findUnique({ where: { id: req.query.category } })
        : await prisma.category.findUnique({ where: { slug: req.query.category } });
      if (category) {
        const ids = await categoryWithChildren(category.id);
        where.categoryId = { in: ids };
      } else {
        where.categoryId = "00000000-0000-0000-0000-000000000000";
      }
    }
    if (req.query.featured === "1") where.featured = true;
    if (req.query.inStock === "1") where.stock = { gt: 0 };
    if (req.query.q) {
      where.OR = [
        { name: { contains: req.query.q, mode: "insensitive" } },
        { nameBn: { contains: req.query.q, mode: "insensitive" } },
        { description: { contains: req.query.q, mode: "insensitive" } },
        { sku: { contains: req.query.q, mode: "insensitive" } },
      ];
    }
    const priceFilter = {};
    if (req.query.minPrice) priceFilter.gte = money(req.query.minPrice);
    if (req.query.maxPrice) priceFilter.lte = money(req.query.maxPrice);
    if (Object.keys(priceFilter).length) where.price = priceFilter;

    const sortMap = {
      newest: [{ createdAt: "desc" }],
      price_asc: [{ price: "asc" }],
      price_desc: [{ price: "desc" }],
      name: [{ name: "asc" }],
      rating: [{ reviews: { _count: "desc" } }],
      best_selling: [{ orderItems: { _count: "desc" } }],
    };
    const orderBy = sortMap[req.query.sort] || sortMap.newest;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          category: { select: { id: true, name: true, nameBn: true, slug: true } },
          reviews: { select: { rating: true } },
          _count: { select: { orderItems: true, reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    let rows = products.map(presentProduct);
    if (req.query.sort === "rating") {
      rows = rows.sort((a, b) => b.ratingAverage - a.ratingAverage || b.reviewCount - a.reviewCount);
    }
    if (isAdmin && req.query.lowStock === "1") rows = rows.filter((p) => p.stock <= p.lowStockThreshold);

    res.json({ products: rows, total, page, pageSize });
  })
);

router.get(
  "/slug/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, ...(req.user?.role === "ADMIN" ? {} : { published: true }) },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
        _count: { select: { orderItems: true, reviews: true } },
      },
    });
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ product: presentProduct(product) });
  })
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw new HttpError(404, "Product not found");
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, ...(req.user?.role === "ADMIN" ? {} : { published: true }) },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
        _count: { select: { orderItems: true, reviews: true } },
      },
    });
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ product: presentProduct(product) });
  })
);

const productSchema = z.object({
  name: z.string().min(2).max(160),
  nameBn: z.string().min(1).max(160),
  slug: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().min(1),
  descriptionBn: z.string().min(1),
  ingredients: z.string().nullable().optional(),
  ingredientsBn: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  originBn: z.string().nullable().optional(),
  storageInstructions: z.string().nullable().optional(),
  storageInstructionsBn: z.string().nullable().optional(),
  certification: z.string().nullable().optional(),
  certificationBn: z.string().nullable().optional(),
  categoryId: z.string().uuid(),
  price: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().nullable().optional(),
  unit: z.string().min(1).max(40),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
});

function checkPrices(data) {
  if (data.salePrice !== null && data.salePrice !== undefined && parseMoney(data.salePrice).gte(data.price)) {
    throw new HttpError(400, "Sale price must be lower than regular price");
  }
}

router.post(
  "/",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
    const data = parsed.data;
    checkPrices(data);
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new HttpError(400, "Category not found");
    const slug = await uniqueSlug(prisma, "product", data.slug || data.name);
    const sku = await uniqueSku(prisma, data.sku);
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...data,
          slug,
          sku,
          price: money(data.price),
          salePrice: data.salePrice === null || data.salePrice === undefined ? null : money(data.salePrice),
          images: data.images || [],
        },
      });
      if (created.stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: created.id,
            type: "RESTOCK",
            quantity: created.stock,
            referenceType: "initial",
            note: "Initial stock",
            createdBy: req.user.id,
          },
        });
      }
      return created;
    });
    res.status(201).json({ product: presentProduct(product) });
  })
);

router.put(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Product not found");
    const data = { ...parsed.data };
    if (data.price !== undefined || data.salePrice !== undefined) {
      checkPrices({
        price: data.price !== undefined ? parseMoney(data.price) : existing.price,
        salePrice: data.salePrice !== undefined ? (data.salePrice === null ? null : parseMoney(data.salePrice)) : existing.salePrice,
      });
    }
    if (data.price !== undefined) data.price = money(data.price);
    if (data.salePrice !== undefined) data.salePrice = data.salePrice === null ? null : money(data.salePrice);
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new HttpError(400, "Category not found");
    }
    if (data.slug) data.slug = await uniqueSlug(prisma, "product", data.slug, req.params.id);
    if (data.name && !data.slug) data.slug = await uniqueSlug(prisma, "product", data.name, req.params.id);
    if (data.sku) data.sku = await uniqueSku(prisma, data.sku, req.params.id);

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id: req.params.id }, data });
      if (data.stock !== undefined && data.stock !== existing.stock) {
        await tx.inventoryMovement.create({
          data: {
            productId: updated.id,
            type: "ADJUSTMENT",
            quantity: data.stock - existing.stock,
            referenceType: "manual",
            note: "Stock adjusted from product editor",
            createdBy: req.user.id,
          },
        });
      }
      return updated;
    });
    res.json({ product: presentProduct(product) });
  })
);

router.patch(
  "/:id/publish",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const schema = z.object({ published: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "published must be true or false");
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { published: parsed.data.published },
    });
    res.json({ product: presentProduct(product) });
  })
);

router.patch(
  "/:id/stock",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      quantity: z.coerce.number().int(),
      note: z.string().optional(),
      type: z.enum(["RESTOCK", "ADJUSTMENT"]).default("ADJUSTMENT"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid stock update");
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Product not found");
    if (parsed.data.quantity === 0) throw new HttpError(400, "Quantity cannot be zero");
    if (existing.stock + parsed.data.quantity < 0) throw new HttpError(400, "Stock cannot become negative");
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: existing.id },
        data: { stock: { increment: parsed.data.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: existing.id,
          type: parsed.data.type,
          quantity: parsed.data.quantity,
          referenceType: "manual",
          note: parsed.data.note || "Manual stock update",
          createdBy: req.user.id,
        },
      });
      return updated;
    });
    res.json({ product: presentProduct(product) });
  })
);

router.delete(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const orderItems = await prisma.orderItem.count({ where: { productId: req.params.id } });
    if (orderItems > 0) {
      await prisma.product.update({ where: { id: req.params.id }, data: { published: false } });
      return res.json({ unpublished: true, message: "Product has order history and was unpublished instead of deleted" });
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
