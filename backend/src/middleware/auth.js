import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { HttpError } from "../lib/http.js";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export async function authRequired(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) throw new HttpError(401, "Authentication required");
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, phone: true, role: true, active: true },
    });
    if (!user || !user.active) throw new HttpError(401, "Account is not active");
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "Insufficient permissions"));
    }
    next();
  };
}

export const adminOnly = [authRequired, requireRole("ADMIN")];
export const customerOnly = [authRequired, requireRole("CUSTOMER")];

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, phone: true, role: true, active: true },
    });
  } catch {
    req.user = null;
  }
  next();
}
