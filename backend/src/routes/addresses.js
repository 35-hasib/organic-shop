import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";

const router = Router();
router.use(authRequired, requireRole("CUSTOMER"));

const addressSchema = z.object({
  label: z.string().min(1).max(30).default("Home"),
  recipientName: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  division: z.string().min(1).max(60),
  district: z.string().min(1).max(60),
  area: z.string().min(1).max(100),
  addressLine: z.string().min(5).max(300),
  postalCode: z.string().max(10).nullable().optional(),
  isDefault: z.boolean().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json({ addresses });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid address", parsed.error.flatten());
    const count = await prisma.address.count({ where: { userId: req.user.id } });
    const isDefault = parsed.data.isDefault === true || count === 0;
    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
      return tx.address.create({
        data: {
          ...parsed.data,
          postalCode: parsed.data.postalCode || null,
          isDefault,
          userId: req.user.id,
        },
      });
    });
    res.status(201).json({ address });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = addressSchema.partial().safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid address", parsed.error.flatten());
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) throw new HttpError(404, "Address not found");
    const address = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
      }
      return tx.address.update({
        where: { id: existing.id },
        data: {
          ...parsed.data,
          postalCode: parsed.data.postalCode === "" ? null : parsed.data.postalCode,
        },
      });
    });
    res.json({ address });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) throw new HttpError(404, "Address not found");
    await prisma.address.delete({ where: { id: existing.id } });
    if (existing.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    res.status(204).end();
  })
);

export default router;
