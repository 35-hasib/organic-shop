import express from "express";
import cors from "cors";
import { prisma } from "./prisma.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import addressRoutes from "./routes/addresses.js";
import deliveryRoutes from "./routes/delivery.js";
import couponRoutes from "./routes/coupons.js";
import orderRoutes from "./routes/orders.js";
import reviewRoutes from "./routes/reviews.js";
import notificationRoutes from "./routes/notifications.js";
import uploadRoutes from "./routes/uploads.js";
import adminRoutes from "./routes/admin.js";
import contentRoutes from "./routes/content.js";

export function createApp() {
  const app = express();
  const origins = (process.env.CORS_ORIGIN || "").split(",").map((value) => value.trim()).filter(Boolean);
  app.use(cors({ origin: origins.length ? origins : true }));
  app.use(express.json({ limit: "1mb" }));

  app.get(["/health", "/api/health"], async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    } catch {
      res.status(500).json({ ok: false, error: "Database unreachable" });
    }
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/addresses", addressRoutes);
  app.use("/api/delivery-areas", deliveryRoutes);
  app.use("/api/coupons", couponRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", contentRoutes);

  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  app.use((error, _req, res, _next) => {
    let status = error.status || 500;
    let message = error.message || "Something went wrong";
    if (error.code === "P2002") {
      status = 409;
      message = "A record with this unique value already exists";
    }
    if (error.code === "P2025") {
      status = 404;
      message = "Record not found";
    }
    if (status >= 500) console.error(error);
    if (status === 500) message = "Internal server error";
    res.status(status).json({
      error: message,
      ...(error.details ? { details: error.details } : {}),
    });
  });

  return app;
}
