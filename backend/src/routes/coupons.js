import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeDecimals } from "../lib/serialize.js";
import { validateCoupon } from "../services/coupons.js";
import { money, parseMoney } from "../lib/money.js";

const router = Router();

router.get(
  "/",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ coupons: serializeDecimals(coupons) });
  })
);

router.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      select: {
        code: true,
        description: true,
        type: true,
        value: true,
        minOrderAmount: true,
        maxDiscount: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    res.json({ coupons: serializeDecimals(coupons) });
  })
);

router.post(
  "/validate",
  authRequired,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const schema = z.object({ code: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Coupon code is required");
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });
    const subtotal = items.reduce((sum, item) => {
      const price = item.product.salePrice !== null ? parseMoney(item.product.salePrice) : parseMoney(item.product.price);
      return sum.plus(price.mul(item.quantity));
    }, parseMoney(0));
    const result = await validateCoupon(prisma, {
      code: parsed.data.code,
      userId: req.user.id,
      subtotal,
    });
    res.json({
      code: result.coupon.code,
      discount: money(result.discount),
      description: result.coupon.description,
    });
  })
);

const schema = z.object({
  code: z.string().min(2).max(30),
  description: z.string().nullable().optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).nullable().optional(),
  usageLimit: z.coerce.number().int().min(1).nullable().optional(),
  perCustomerLimit: z.coerce.number().int().min(1).optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

function normalize(data) {
  const out = { ...data };
  out.code = data.code.trim().toUpperCase();
  if (data.value !== undefined) out.value = money(data.value);
  if (data.minOrderAmount !== undefined) out.minOrderAmount = money(data.minOrderAmount);
  if (data.maxDiscount !== undefined) out.maxDiscount = data.maxDiscount === null ? null : money(data.maxDiscount);
  if (data.startsAt !== undefined) out.startsAt = data.startsAt ? new Date(data.startsAt) : null;
  if (data.expiresAt !== undefined) out.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  return out;
}

router.post(
  "/",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid coupon", parsed.error.flatten());
    const coupon = await prisma.coupon.create({ data: normalize(parsed.data) });
    res.status(201).json({ coupon: serializeDecimals(coupon) });
  })
);

router.put(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid coupon", parsed.error.flatten());
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Coupon not found");
    const coupon = await prisma.coupon.update({
      where: { id: existing.id },
      data: normalize(parsed.data),
    });
    res.json({ coupon: serializeDecimals(coupon) });
  })
);

router.delete(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const used = await prisma.order.count({ where: { couponId: req.params.id } });
    if (used > 0) {
      await prisma.coupon.update({ where: { id: req.params.id }, data: { active: false } });
      return res.json({ deactivated: true });
    }
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
