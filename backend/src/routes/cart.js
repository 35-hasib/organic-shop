import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeDecimals } from "../lib/serialize.js";
import { money, parseMoney } from "../lib/money.js";

const router = Router();
router.use(authRequired, requireRole("CUSTOMER"));

async function cartPayload(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        include: { category: { select: { id: true, name: true, nameBn: true, slug: true } } },
      },
    },
  });
  let subtotal = parseMoney(0);
  const rows = items.map((item) => {
    const unitPrice = item.product.salePrice !== null ? parseMoney(item.product.salePrice) : parseMoney(item.product.price);
    const lineTotal = unitPrice.mul(item.quantity);
    subtotal = subtotal.plus(lineTotal);
    return serializeDecimals({
      ...item,
      unitPrice,
      lineTotal,
    });
  });
  return {
    items: rows,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: money(subtotal),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await cartPayload(req.user.id));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      productId: z.string().uuid(),
      quantity: z.coerce.number().int().min(1).max(99).default(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid cart item");
    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, published: true },
    });
    if (!product) throw new HttpError(404, "Product not found");
    if (product.stock < parsed.data.quantity) {
      throw new HttpError(409, `Only ${product.stock} ${product.unit} available`);
    }
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
      create: { userId: req.user.id, productId: product.id, quantity: parsed.data.quantity },
      update: { quantity: parsed.data.quantity },
    });
    res.status(201).json(await cartPayload(req.user.id));
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const schema = z.object({ quantity: z.coerce.number().int().min(1).max(99) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Quantity must be between 1 and 99");
    const item = await prisma.cartItem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { product: true },
    });
    if (!item) throw new HttpError(404, "Cart item not found");
    if (item.product.stock < parsed.data.quantity) {
      throw new HttpError(409, `Only ${item.product.stock} ${item.product.unit} available`);
    }
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: parsed.data.quantity } });
    res.json(await cartPayload(req.user.id));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await prisma.cartItem.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) throw new HttpError(404, "Cart item not found");
    await prisma.cartItem.delete({ where: { id: item.id } });
    res.json(await cartPayload(req.user.id));
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.json(await cartPayload(req.user.id));
  })
);

export default router;
