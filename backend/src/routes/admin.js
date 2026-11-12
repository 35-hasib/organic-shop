import { Router } from "express";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError, pagination } from "../lib/http.js";
import { serializeDecimals } from "../lib/serialize.js";
import { money, parseMoney } from "../lib/money.js";
import { sendCsv } from "../lib/csv.js";

const router = Router();
router.use(authRequired, requireRole("ADMIN"));

function range(query) {
  const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : new Date();
  const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { from, to };
}

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const { from, to } = range(req.query);
    const [orders, customers, products, lowStock, statusGroups, recentOrders, deliveredOrders] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.product.count({ where: { published: true, stock: { lte: 10 } } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true }, where: { createdAt: { gte: from, lte: to } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: true, user: { select: { name: true, phone: true } } },
      }),
      prisma.order.findMany({
        where: { status: "DELIVERED", createdAt: { gte: from, lte: to } },
        select: { total: true, createdAt: true },
      }),
    ]);
    const revenue = deliveredOrders.reduce((sum, order) => sum.plus(parseMoney(order.total)), parseMoney(0));
    const dailyMap = new Map();
    for (const order of deliveredOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) || parseMoney(0)).plus(parseMoney(order.total)));
    }
    const topProducts = await prisma.$queryRawUnsafe(
      `SELECT oi.product_name AS name, SUM(oi.quantity)::int AS quantity, SUM(oi.line_total)::numeric(14,2) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.status NOT IN ('CANCELLED','RETURNED') AND o.created_at >= $1 AND o.created_at <= $2
       GROUP BY oi.product_name ORDER BY quantity DESC LIMIT 8`,
      from,
      to
    );
    const pendingOrders = statusGroups.find((group) => group.status === "PENDING")?._count._all || 0;
    res.json({
      stats: {
        revenue: money(revenue),
        orders,
        pendingOrders,
        customers,
        products,
        lowStock,
        averageOrderValue: deliveredOrders.length ? money(revenue.div(deliveredOrders.length)) : "0.00",
        statusCounts: Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all])),
        dailySales: [...dailyMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, amount]) => ({ date, revenue: money(amount) })),
        topProducts: serializeDecimals(topProducts),
        recentOrders: serializeDecimals(recentOrders),
      },
    });
  })
);

router.get(
  "/customers",
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = pagination(req.query, { pageSize: 20 });
    const where = {
      role: "CUSTOMER",
      ...(req.query.q
        ? {
            OR: [
              { name: { contains: req.query.q, mode: "insensitive" } },
              { email: { contains: req.query.q, mode: "insensitive" } },
              { phone: { contains: req.query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          active: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    const ids = customers.map((customer) => customer.id);
    const spend = await prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _sum: { total: true },
      _max: { createdAt: true },
    });
    const spendMap = new Map(spend.map((row) => [row.userId, row]));
    res.json({
      customers: customers.map((customer) => ({
        ...customer,
        totalSpent: money(spendMap.get(customer.id)?._sum.total || 0),
        lastOrderAt: spendMap.get(customer.id)?._max.createdAt || null,
      })),
      total,
      page,
      pageSize,
    });
  })
);

router.get(
  "/customers/:id",
  asyncHandler(async (req, res) => {
    const customer = await prisma.user.findFirst({
      where: { id: req.params.id, role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        createdAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { items: true },
        },
      },
    });
    if (!customer) throw new HttpError(404, "Customer not found");
    res.json({ customer: serializeDecimals(customer) });
  })
);

router.patch(
  "/customers/:id",
  asyncHandler(async (req, res) => {
    const active = req.body?.active;
    if (typeof active !== "boolean") throw new HttpError(400, "active must be true or false");
    const customer = await prisma.user.update({
      where: { id: req.params.id },
      data: { active },
      select: { id: true, name: true, email: true, phone: true, active: true },
    });
    res.json({ customer });
  })
);

router.get(
  "/low-stock",
  asyncHandler(async (_req, res) => {
    const products = await prisma.$queryRawUnsafe(
      `SELECT id, name, name_bn AS "nameBn", sku, stock, low_stock_threshold AS "lowStockThreshold", unit, published
       FROM products WHERE stock <= low_stock_threshold ORDER BY stock ASC`
    );
    res.json({ products });
  })
);

router.get(
  "/inventory/:productId",
  asyncHandler(async (req, res) => {
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId: req.params.productId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { editor: { select: { name: true } } },
    });
    res.json({ movements });
  })
);

router.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const { from, to } = range(req.query);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { items: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const valid = orders.filter((order) => !["CANCELLED", "RETURNED"].includes(order.status));
    const revenue = valid.reduce((sum, order) => sum.plus(parseMoney(order.total)), parseMoney(0));
    const productMap = new Map();
    const dailyMap = new Map();
    for (const order of valid) {
      const day = order.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || parseMoney(0)).plus(parseMoney(order.total)));
      for (const item of order.items) {
        const current = productMap.get(item.productName) || { name: item.productName, quantity: 0, revenue: parseMoney(0) };
        current.quantity += item.quantity;
        current.revenue = current.revenue.plus(parseMoney(item.lineTotal));
        productMap.set(item.productName, current);
      }
    }
    res.json({
      report: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        orderCount: orders.length,
        validOrderCount: valid.length,
        revenue: money(revenue),
        averageOrderValue: valid.length ? money(revenue.div(valid.length)) : "0.00",
        daily: [...dailyMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, amount]) => ({ date, revenue: money(amount) })),
        products: [...productMap.values()]
          .sort((a, b) => b.revenue.comparedTo(a.revenue))
          .map((row) => ({ ...row, revenue: money(row.revenue) })),
        orders: serializeDecimals(orders),
      },
    });
  })
);

router.get(
  "/export/orders",
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(req.query.from);
      if (req.query.to) where.createdAt.lte = new Date(`${req.query.to}T23:59:59.999Z`);
    }
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true, user: { select: { name: true, email: true } } },
    });
    sendCsv(
      res,
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      orders.map((order) => ({
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString(),
        customer: order.user?.name || order.shippingName,
        email: order.user?.email || "",
        phone: order.shippingPhone,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        items: order.items.map((item) => `${item.productName} x${item.quantity}`).join("; "),
        subtotal: money(order.subtotal),
        discount: money(order.discount),
        deliveryFee: money(order.deliveryFee),
        total: money(order.total),
        address: `${order.shippingAddress}, ${order.shippingArea}, ${order.shippingDistrict}`,
      }))
    );
  })
);

router.get(
  "/export/sales",
  asyncHandler(async (req, res) => {
    const { from, to } = range(req.query);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "RETURNED"] } },
      include: { items: true },
    });
    const productMap = new Map();
    for (const order of orders) {
      for (const item of order.items) {
        const row = productMap.get(item.productName) || {
          product: item.productName,
          quantity: 0,
          revenue: parseMoney(0),
        };
        row.quantity += item.quantity;
        row.revenue = row.revenue.plus(parseMoney(item.lineTotal));
        productMap.set(item.productName, row);
      }
    }
    const rows = [...productMap.values()]
      .sort((a, b) => b.revenue.comparedTo(a.revenue))
      .map((row) => ({
        product: row.product,
        quantity: row.quantity,
        revenue: money(row.revenue),
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      }));
    sendCsv(res, `sales-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv`, rows);
  })
);

export default router;
