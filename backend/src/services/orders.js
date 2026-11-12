import { prisma } from "../prisma.js";
import { HttpError } from "../lib/http.js";
import { money, parseMoney } from "../lib/money.js";
import { consumeCoupon, releaseCoupon, validateCoupon } from "./coupons.js";

const cancellationStatuses = ["PENDING", "CONFIRMED", "PROCESSING"];
const statusTransitions = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORG-${date}-${random}`;
}

export function canTransition(from, to) {
  return (statusTransitions[from] || []).includes(to);
}

async function restoreStock(tx, order, type, note, userId) {
  for (const item of order.items) {
    if (!item.productId) continue;
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        type,
        quantity: item.quantity,
        referenceType: "order",
        referenceId: order.id,
        note,
        createdBy: userId || null,
      },
    });
  }
}

async function persistOrder(tx, {
  userId,
  idempotencyKey,
  paymentMethod,
  note,
  shipping,
  area,
  productRows,
  couponCode,
  clearCartForUser,
  actorId,
}) {
  const items = [];
  for (const row of productRows) {
    const product = row.product;
    if (!product.published) throw new HttpError(409, `${product.name} is no longer available`);
    if (row.quantity < 1) throw new HttpError(400, "Invalid cart quantity");
    if (product.stock < row.quantity) {
      throw new HttpError(409, `Only ${product.stock} ${product.unit} of ${product.name} is available`);
    }
    const unitPrice = product.salePrice !== null ? parseMoney(product.salePrice) : parseMoney(product.price);
    const lineTotal = unitPrice.mul(row.quantity);
    items.push({
      product,
      quantity: row.quantity,
      unitPrice,
      lineTotal,
    });
  }

  const subtotal = items.reduce((sum, item) => sum.plus(item.lineTotal), parseMoney(0));
  const couponResult = await validateCoupon(tx, {
    code: couponCode,
    userId,
    subtotal,
  });
  const discount = couponResult ? couponResult.discount : parseMoney(0);
  const discountedSubtotal = subtotal.minus(discount);
  const freeThreshold = area.freeDeliveryThreshold ? parseMoney(area.freeDeliveryThreshold) : null;
  const deliveryFee = freeThreshold && discountedSubtotal.gte(freeThreshold) ? parseMoney(0) : parseMoney(area.charge);
  const total = discountedSubtotal.plus(deliveryFee);

  for (const item of items) {
    const reserved = await tx.product.updateMany({
      where: { id: item.product.id, published: true, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (reserved.count !== 1) {
      throw new HttpError(409, `Insufficient stock for ${item.product.name}`);
    }
  }

  const order = await tx.order.create({
    data: {
      orderNumber: orderNumber(),
      userId,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "UNPAID",
      subtotal: money(subtotal),
      discount: money(discount),
      deliveryFee: money(deliveryFee),
      total: money(total),
      couponId: couponResult?.coupon.id || null,
      couponCode: couponResult?.coupon.code || null,
      shippingName: shipping.name,
      shippingPhone: shipping.phone,
      shippingDivision: shipping.division,
      shippingDistrict: shipping.district,
      shippingArea: shipping.area,
      shippingAddress: shipping.addressLine,
      shippingPostalCode: shipping.postalCode || null,
      note: note || null,
      idempotencyKey,
      items: {
        create: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productNameBn: item.product.nameBn,
          unit: item.product.unit,
          price: money(item.product.price),
          salePrice: item.product.salePrice === null ? null : money(item.product.salePrice),
          quantity: item.quantity,
          lineTotal: money(item.lineTotal),
          imageUrl: item.product.images[0] || null,
        })),
      },
      statusHistory: {
        create: { status: "PENDING", note: "Order placed", changedBy: actorId || null },
      },
    },
    include: { items: true },
  });

  if (couponResult) await consumeCoupon(tx, couponResult.coupon.id);

  await tx.inventoryMovement.createMany({
    data: items.map((item) => ({
      productId: item.product.id,
      type: "SALE",
      quantity: -item.quantity,
      referenceType: "order",
      referenceId: order.id,
      note: `Order ${order.orderNumber}`,
      createdBy: actorId || null,
    })),
  });

  if (clearCartForUser) await tx.cartItem.deleteMany({ where: { userId: clearCartForUser } });
  if (userId) {
    await tx.notification.create({
      data: {
        userId,
        orderId: order.id,
        title: "Order placed",
        message: `Your order ${order.orderNumber} has been placed successfully.`,
      },
    });
  }

  return order;
}

export async function createOrder(userId, input) {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true },
  });
  if (existing) {
    if (existing.userId !== userId) throw new HttpError(409, "Duplicate request key");
    return existing;
  }

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    });
    if (cart.length === 0) throw new HttpError(400, "Your cart is empty");

    const address = await tx.address.findFirst({
      where: { id: input.addressId, userId },
    });
    if (!address) throw new HttpError(400, "Select a valid delivery address");

    const area = await tx.deliveryArea.findFirst({
      where: { id: input.deliveryAreaId, active: true },
    });
    if (!area) throw new HttpError(400, "Select a valid delivery area");

    return persistOrder(tx, {
      userId,
      idempotencyKey: input.idempotencyKey,
      paymentMethod: input.paymentMethod,
      note: input.note,
      shipping: {
        name: address.recipientName,
        phone: address.phone,
        division: address.division,
        district: address.district,
        area: address.area,
        addressLine: address.addressLine,
        postalCode: address.postalCode,
      },
      area,
      productRows: cart.map((row) => ({ product: row.product, quantity: row.quantity })),
      couponCode: input.couponCode,
      clearCartForUser: userId,
      actorId: userId,
    });
  });
}

export async function createGuestOrder(input) {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true },
  });
  if (existing) {
    if (existing.shippingPhone !== input.customerPhone) throw new HttpError(409, "Duplicate request key");
    return existing;
  }

  return prisma.$transaction(async (tx) => {
    const area = await tx.deliveryArea.findFirst({
      where: { id: input.deliveryAreaId, active: true },
    });
    if (!area) throw new HttpError(400, "Select a valid delivery area");

    const quantityByProduct = new Map();
    for (const item of input.items) {
      quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) || 0) + item.quantity);
    }
    const products = await tx.product.findMany({
      where: { id: { in: [...quantityByProduct.keys()] } },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));
    const productRows = [];
    for (const [productId, quantity] of quantityByProduct) {
      const product = productMap.get(productId);
      if (!product) throw new HttpError(409, "One or more products are no longer available");
      productRows.push({ product, quantity });
    }

    return persistOrder(tx, {
      userId: null,
      idempotencyKey: input.idempotencyKey,
      paymentMethod: input.paymentMethod,
      note: input.note,
      shipping: {
        name: input.customerName,
        phone: input.customerPhone,
        division: area.division,
        district: input.city,
        area: input.area,
        addressLine: input.address,
      },
      area,
      productRows,
      couponCode: input.couponCode,
      clearCartForUser: null,
      actorId: null,
    });
  });
}

export async function findGuestCustomer(phone) {
  const order = await prisma.order.findFirst({
    where: { shippingPhone: phone },
    orderBy: { createdAt: "desc" },
    select: {
      shippingName: true,
      shippingPhone: true,
      shippingAddress: true,
      shippingDistrict: true,
      shippingArea: true,
      shippingDivision: true,
      note: true,
    },
  });
  if (!order) return null;
  return {
    name: order.shippingName,
    phone: order.shippingPhone,
    address: order.shippingAddress,
    city: order.shippingDistrict,
    area: order.shippingArea,
    insideDhaka: order.shippingDivision.toLowerCase() === "dhaka",
    note: order.note || "",
  };
}

export async function getOrderByNumber(orderNumber) {
  const normalized = String(orderNumber || "").trim().toUpperCase();
  if (!normalized) throw new HttpError(400, "Order number is required");
  const order = await prisma.order.findUnique({
    where: { orderNumber: normalized },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) throw new HttpError(404, "Order not found");
  return order;
}

export async function getGuestOrder(id, phone) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Order not found");
  const order = await prisma.order.findFirst({
    where: { id, shippingPhone: phone },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) throw new HttpError(404, "Order not found");
  return order;
}

export async function changeOrderStatus({ orderId, status, note, actorId }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new HttpError(404, "Order not found");

    if (!canTransition(order.status, status)) {
      throw new HttpError(400, `Cannot change order from ${order.status} to ${status}`);
    }

    const now = new Date();
    const data = { status };
    if (status === "DELIVERED") {
      data.deliveredAt = now;
      if (order.paymentMethod === "COD") data.paymentStatus = "PAID";
    }
    if (status === "CANCELLED") data.cancelledAt = now;
    if (status === "RETURNED" && order.paymentStatus === "PAID") data.paymentStatus = "REFUNDED";

    if (["CANCELLED", "RETURNED"].includes(status)) {
      await restoreStock(
        tx,
        order,
        status === "CANCELLED" ? "CANCELLATION" : "RETURN",
        `Order ${order.orderNumber} ${status.toLowerCase()}`,
        actorId
      );
      await releaseCoupon(tx, order.couponId);
    }

    const updated = await tx.order.update({ where: { id: order.id }, data });
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status, note: note || null, changedBy: actorId },
    });
    if (order.userId) {
      await tx.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          title: `Order ${status.toLowerCase()}`,
          message: `Your order ${order.orderNumber} is now ${status.toLowerCase()}.`,
        },
      });
    }

    return updated;
  });
}

export async function cancelOrderByCustomer({ orderId, userId, note }) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new HttpError(404, "Order not found");
  if (!cancellationStatuses.includes(order.status)) {
    throw new HttpError(400, "This order can no longer be cancelled");
  }
  return changeOrderStatus({
    orderId,
    status: "CANCELLED",
    note: note || "Cancelled by customer",
    actorId: userId,
  });
}

export async function createOrderRequest({ orderId, userId, type, reason }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status !== "DELIVERED") {
      throw new HttpError(400, "Return or refund requests require a delivered order");
    }
    const pending = await tx.orderRequest.findFirst({
      where: { orderId, status: "PENDING" },
    });
    if (pending) throw new HttpError(409, "A request is already pending for this order");
    return tx.orderRequest.create({
      data: { orderId, userId, type, reason },
    });
  });
}

export async function resolveOrderRequest({ requestId, status, adminNote, adminId }) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.orderRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new HttpError(404, "Request not found");
    if (request.status !== "PENDING") throw new HttpError(400, "Request has already been resolved");
    const updated = await tx.orderRequest.update({
      where: { id: requestId },
      data: { status, adminNote: adminNote || null },
    });
    if (status === "APPROVED") {
      const order = await tx.order.findUnique({
        where: { id: request.orderId },
        include: { items: true },
      });
      if (order && order.status === "DELIVERED") {
        await restoreStock(tx, order, "RETURN", `Return approved for ${order.orderNumber}`, adminId);
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "RETURNED",
            paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus,
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "RETURNED",
            note: "Return/refund approved",
            changedBy: adminId,
          },
        });
        if (order.userId) {
          await tx.notification.create({
            data: {
              userId: order.userId,
              orderId: order.id,
              title: "Return approved",
              message: `Your return request for ${order.orderNumber} has been approved.`,
            },
          });
        }
      }
    }
    return updated;
  });
}
