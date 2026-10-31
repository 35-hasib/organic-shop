import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError, pagination } from "../lib/http.js";

const router = Router();

router.get(
  "/product/:productId",
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = pagination(req.query, { pageSize: 10 });
    const where = { productId: req.params.productId };
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { user: { select: { name: true } } },
      }),
      prisma.review.count({ where }),
    ]);
    res.json({ reviews, total, page, pageSize });
  })
);

router.post(
  "/",
  authRequired,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      productId: z.string().uuid(),
      rating: z.coerce.number().int().min(1).max(5),
      comment: z.string().max(1500).nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid review", parsed.error.flatten());

    const order = await prisma.order.findFirst({
      where: {
        userId: req.user.id,
        status: "DELIVERED",
        items: { some: { productId: parsed.data.productId } },
      },
      orderBy: { deliveredAt: "desc" },
      select: { id: true },
    });
    if (!order) throw new HttpError(403, "Only verified purchasers can review this product");

    const review = await prisma.review.upsert({
      where: { productId_userId: { productId: parsed.data.productId, userId: req.user.id } },
      create: {
        productId: parsed.data.productId,
        userId: req.user.id,
        orderId: order.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
      update: {
        orderId: order.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
      include: { user: { select: { name: true } } },
    });
    res.status(201).json({ review });
  })
);

router.delete(
  "/:id",
  authRequired,
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const review = await prisma.review.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!review) throw new HttpError(404, "Review not found");
    await prisma.review.delete({ where: { id: review.id } });
    res.status(204).end();
  })
);

export default router;
