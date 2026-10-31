import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeDecimals } from "../lib/serialize.js";
import { money } from "../lib/money.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const areas = await prisma.deliveryArea.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    res.json({ areas: serializeDecimals(areas) });
  })
);

const schema = z.object({
  name: z.string().min(1).max(100),
  nameBn: z.string().min(1).max(100),
  division: z.string().min(1).max(60),
  district: z.string().min(1).max(60),
  charge: z.coerce.number().min(0),
  freeDeliveryThreshold: z.coerce.number().min(0).nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

router.get(
  "/admin",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const areas = await prisma.deliveryArea.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    res.json({ areas: serializeDecimals(areas) });
  })
);

router.post(
  "/",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid delivery area", parsed.error.flatten());
    const area = await prisma.deliveryArea.create({
      data: {
        ...parsed.data,
        charge: money(parsed.data.charge),
        freeDeliveryThreshold:
          parsed.data.freeDeliveryThreshold === null || parsed.data.freeDeliveryThreshold === undefined
            ? null
            : money(parsed.data.freeDeliveryThreshold),
      },
    });
    res.status(201).json({ area: serializeDecimals(area) });
  })
);

router.put(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid delivery area", parsed.error.flatten());
    const data = { ...parsed.data };
    if (data.charge !== undefined) data.charge = money(data.charge);
    if (data.freeDeliveryThreshold !== undefined) {
      data.freeDeliveryThreshold = data.freeDeliveryThreshold === null ? null : money(data.freeDeliveryThreshold);
    }
    const area = await prisma.deliveryArea.update({ where: { id: req.params.id }, data });
    res.json({ area: serializeDecimals(area) });
  })
);

router.delete(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.deliveryArea.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
