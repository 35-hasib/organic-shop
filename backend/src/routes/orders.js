import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError, pagination } from "../lib/http.js";
import { serializeDecimals } from "../lib/serialize.js";
import {
  cancelOrderByCustomer,
  changeOrderStatus,
  createOrder,
  createOrderRequest,
  resolveOrderRequest,
} from "../services/orders.js";

const router = Router();
router.use(authRequired);

const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  deliveryAreaId: z.string().uuid(),
  couponCode: z.string().max(30).nullable().optional(),
  paymentMethod: z.enum(["COD"]).default("COD"),
  note: z.string().max(1000).nullable().optional(),
  idempotencyKey: z.string().min(8).max(100),
});

router.post(
  "/",
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid checkout details", parsed.error.flatten());
    const order = await createOrder(req.user.id, parsed.data);
    res.status(201).json({ order: serializeDecimals(order) });
  })
);

router.get(
  "/",
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = pagination(req.query, { pageSize: 10 });
    const where = { userId: req.user.id, ...(req.query.status ? { status: req.query.status } : {}) };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { items: true, requests: true },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders: serializeDecimals(orders), total, page, pageSize });
  })
);

router.get(
  "/admin",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = pagination(req.query, { pageSize: 20 });
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.dateFrom || req.query.dateTo) {
      where.createdAt = {};
      if (req.query.dateFrom) where.createdAt.gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) where.createdAt.lte = new Date(`${req.query.dateTo}T23:59:59.999Z`);
    }
    if (req.query.q) {
      where.OR = [
        { orderNumber: { contains: req.query.q, mode: "insensitive" } },
        { shippingName: { contains: req.query.q, mode: "insensitive" } },
        { shippingPhone: { contains: req.query.q, mode: "insensitive" } },
        { user: { name: { contains: req.query.q, mode: "insensitive" } } },
      ];
    }
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders: serializeDecimals(orders), total, page, pageSize });
  })
);

router.get(
  "/admin/requests",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = pagination(req.query, { pageSize: 20 });
    const where = req.query.status ? { status: req.query.status } : {};
    const [requests, total] = await Promise.all([
      prisma.orderRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          order: { select: { id: true, orderNumber: true, status: true, total: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.orderRequest.count({ where }),
    ]);
    res.json({ requests: serializeDecimals(requests), total, page, pageSize });
  })
);

router.patch(
  "/admin/requests/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      status: z.enum(["APPROVED", "REJECTED"]),
      adminNote: z.string().max(1000).nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid request update");
    const request = await resolveOrderRequest({
      requestId: req.params.id,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
      adminId: req.user.id,
    });
    res.json({ request: serializeDecimals(request) });
  })
);

router.get(
  "/admin/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        statusHistory: { orderBy: { createdAt: "asc" }, include: { editor: { select: { name: true } } } },
        requests: true,
        coupon: true,
      },
    });
    if (!order) throw new HttpError(404, "Order not found");
    res.json({ order: serializeDecimals(order) });
  })
);

router.patch(
  "/admin/:id/status",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]),
      note: z.string().max(1000).nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid order status");
    const order = await changeOrderStatus({
      orderId: req.params.id,
      status: parsed.data.status,
      note: parsed.data.note,
      actorId: req.user.id,
    });
    res.json({ order: serializeDecimals(order) });
  })
);

router.patch(
  "/admin/:id/payment",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const schema = z.object({ paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid payment status");
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { paymentStatus: parsed.data.paymentStatus },
    });
    res.json({ order: serializeDecimals(order) });
  })
);

router.get(
  "/:id",
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        requests: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) throw new HttpError(404, "Order not found");
    res.json({ order: serializeDecimals(order) });
  })
);

router.post(
  "/:id/cancel",
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const schema = z.object({ note: z.string().max(500).optional() });
    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) throw new HttpError(400, "Invalid cancellation request");
    const order = await cancelOrderByCustomer({
      orderId: req.params.id,
      userId: req.user.id,
      note: parsed.data.note,
    });
    res.json({ order: serializeDecimals(order) });
  })
);

router.post(
  "/:id/request",
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      type: z.enum(["RETURN", "REFUND"]),
      reason: z.string().min(5).max(1000),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid request", parsed.error.flatten());
    const request = await createOrderRequest({
      orderId: req.params.id,
      userId: req.user.id,
      type: parsed.data.type,
      reason: parsed.data.reason,
    });
    res.status(201).json({ request: serializeDecimals(request) });
  })
);

export default router;
