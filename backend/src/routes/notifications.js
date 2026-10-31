import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError, pagination } from "../lib/http.js";

const router = Router();
router.use(authRequired);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = pagination(req.query, { pageSize: 20 });
    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notification.count({ where: { userId: req.user.id } }),
      prisma.notification.count({ where: { userId: req.user.id, read: false } }),
    ]);
    res.json({ notifications, total, unread, page, pageSize });
  })
);

router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) throw new HttpError(404, "Notification not found");
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    });
    res.json({ notification: updated });
  })
);

router.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  })
);

router.post(
  "/broadcast",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      title: z.string().min(2).max(120),
      message: z.string().min(2).max(1000),
      customerIds: z.array(z.string().uuid()).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid notification", parsed.error.flatten());
    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        active: true,
        ...(parsed.data.customerIds?.length ? { id: { in: parsed.data.customerIds } } : {}),
      },
      select: { id: true },
    });
    if (!customers.length) throw new HttpError(400, "No customers found");
    await prisma.notification.createMany({
      data: customers.map((customer) => ({
        userId: customer.id,
        title: parsed.data.title,
        message: parsed.data.message,
      })),
    });
    res.status(201).json({ sent: customers.length });
  })
);

export default router;
