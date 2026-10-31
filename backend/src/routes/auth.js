import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { signToken, authRequired } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { serializeDecimals } from "../lib/serialize.js";

const router = Router();

const registerSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().min(6).max(20).optional().or(z.literal("")),
    password: z.string().min(6).max(100),
  })
  .refine((value) => value.email || value.phone, { message: "Email or mobile number is required" });

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
    const email = parsed.data.email ? parsed.data.email.toLowerCase() : null;
    const phone = parsed.data.phone || null;
    const conflict = await prisma.user.findFirst({
      where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] },
    });
    if (conflict) throw new HttpError(409, "Email or mobile number is already registered");
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        role: "CUSTOMER",
      },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    res.status(201).json({ token: signToken(user), user: serializeDecimals(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      identifier: z.string().min(1),
      password: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Email/mobile and password are required");
    const identifier = parsed.data.identifier.trim();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] },
    });
    if (!user || !user.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email/mobile or password");
    }
    res.json({
      token: signToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  })
);

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

router.put(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const schema = z
      .object({
        name: z.string().min(2).max(80).optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().min(6).max(20).nullable().optional(),
        password: z.string().min(6).max(100).optional(),
      })
      .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update" });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
    const data = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.email !== undefined) data.email = parsed.data.email ? parsed.data.email.toLowerCase() : null;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
    if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    if (!data.email && !data.phone && (parsed.data.email !== undefined || parsed.data.phone !== undefined)) {
      const current = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!current.email && !current.phone) throw new HttpError(400, "Email or mobile number is required");
    }
    const conflict = await prisma.user.findFirst({
      where: {
        id: { not: req.user.id },
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });
    if (conflict) throw new HttpError(409, "Email or mobile number is already registered");
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    res.json({ user });
  })
);

export default router;
