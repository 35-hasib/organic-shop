import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { prisma } from "./prisma.js";
import { serializeDecimals } from "./lib/serialize.js";

let io = null;

function allowedOrigins() {
  const values = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length ? values : true;
}

export function initRealtime(server) {
  io = new Server(server, {
    path: "/socket.io",
    cors: { origin: allowedOrigins(), methods: ["GET", "POST"] },
  });

  io.use(async (socket, next) => {
    socket.data.user = null;
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, role: true, active: true },
      });
      if (user?.active) socket.data.user = user;
    } catch {
      socket.data.user = null;
    }
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (user) {
      socket.join(`user:${user.id}`);
      if (user.role === "ADMIN") socket.join("admins");
    } else {
      socket.join("public");
    }

    socket.on("order:subscribe", async (raw, ack) => {
      try {
        const orderNumber = String(raw || "").trim().toUpperCase();
        if (!orderNumber) return ack?.({ ok: false, error: "Order number is required" });
        const order = await prisma.order.findUnique({
          where: { orderNumber },
          select: { orderNumber: true, status: true, paymentStatus: true },
        });
        if (!order) return ack?.({ ok: false, error: "Order not found" });
        socket.join(`order:${order.orderNumber}`);
        ack?.({ ok: true, order });
      } catch {
        ack?.({ ok: false, error: "Unable to subscribe" });
      }
    });

    socket.on("order:unsubscribe", (raw) => {
      const orderNumber = String(raw || "").trim().toUpperCase();
      if (orderNumber) socket.leave(`order:${orderNumber}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

function publicOrder(order) {
  const payload = {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId ?? null,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discount: order.discount,
    deliveryFee: order.deliveryFee,
    total: order.total,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deliveredAt: order.deliveredAt ?? null,
    cancelledAt: order.cancelledAt ?? null,
  };
  if (order.items) payload.items = order.items;
  return payload;
}

export function emitOrderEvent(event, order, extra = {}) {
  if (!io || !order) return;
  try {
    const rooms = [`order:${order.orderNumber}`, "admins"];
    if (order.userId) rooms.push(`user:${order.userId}`);
    io.to(rooms).emit(event, serializeDecimals({ order: publicOrder(order), ...extra }));
  } catch (error) {
    console.error("Unable to emit order event", error);
  }
}

export function emitOrderCreated(order) {
  emitOrderEvent("order:created", order);
}

export function emitOrderChanged(order, { event = "order:status", ...extra } = {}) {
  emitOrderEvent(event, order, extra);
}

export function emitOrderRequest(request) {
  if (!io || !request) return;
  try {
    const rooms = ["admins"];
    if (request.userId) rooms.push(`user:${request.userId}`);
    io.to(rooms).emit("order:request", serializeDecimals({ request }));
  } catch (error) {
    console.error("Unable to emit order request", error);
  }
}
