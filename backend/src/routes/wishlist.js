import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeDecimals } from "../lib/serialize.js";

const router = Router();
router.use(authRequired, requireRole("CUSTOMER"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: { category: { select: { id: true, name: true, nameBn: true, slug: true } } },
        },
      },
    });
    res.json({ items: serializeDecimals(items) });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const schema = z.object({ productId: z.string().uuid() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid product");
    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, published: true },
    });
    if (!product) throw new HttpError(404, "Product not found");
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
      create: { userId: req.user.id, productId: product.id },
      update: {},
    });
    res.status(201).json({ ok: true });
  })
);

router.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user.id, productId: req.params.productId },
    });
    res.status(204).end();
  })
);

export default router;
