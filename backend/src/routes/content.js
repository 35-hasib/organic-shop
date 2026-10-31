import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";

const router = Router();

router.get(
  "/banners",
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    res.json({ banners });
  })
);

const bannerSchema = z.object({
  title: z.string().min(1).max(120),
  titleBn: z.string().min(1).max(120),
  subtitle: z.string().nullable().optional(),
  subtitleBn: z.string().nullable().optional(),
  imageUrl: z.string().min(1),
  link: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  active: z.boolean().optional(),
});

router.get(
  "/banners/admin",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    res.json({ banners });
  })
);

router.post(
  "/banners",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = bannerSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid banner", parsed.error.flatten());
    const banner = await prisma.banner.create({
      data: { ...parsed.data, subtitle: parsed.data.subtitle || null, subtitleBn: parsed.data.subtitleBn || null },
    });
    res.status(201).json({ banner });
  })
);

router.put(
  "/banners/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const parsed = bannerSchema.partial().safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid banner", parsed.error.flatten());
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: parsed.data });
    res.json({ banner });
  })
);

router.delete(
  "/banners/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

const PUBLIC_SETTING_KEYS = [
  "storeName",
  "storeNameBn",
  "storePhone",
  "storeEmail",
  "storeAddress",
  "storeAddressBn",
  "facebook",
  "instagram",
  "whatsapp",
  "aboutUs",
  "aboutUsBn",
  "deliveryInfo",
  "deliveryInfoBn",
  "returnPolicy",
  "returnPolicyBn",
  "privacyPolicy",
  "privacyPolicyBn",
  "terms",
  "termsBn",
  "faq",
  "faqBn",
];

router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.storeSetting.findMany({ where: { key: { in: PUBLIC_SETTING_KEYS } } });
    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    res.json({ settings });
  })
);

router.get(
  "/settings/admin",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const rows = await prisma.storeSetting.findMany();
    res.json({ settings: Object.fromEntries(rows.map((row) => [row.key, row.value])) });
  })
);

router.put(
  "/settings",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const schema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid settings");
    await prisma.$transaction(
      Object.entries(parsed.data).map(([key, value]) =>
        prisma.storeSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        })
      )
    );
    const rows = await prisma.storeSetting.findMany();
    res.json({ settings: Object.fromEntries(rows.map((row) => [row.key, row.value])) });
  })
);

const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  subject: z.string().min(2).max(160),
  message: z.string().min(5).max(2000),
});

router.post(
  "/contact",
  asyncHandler(async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid contact message", parsed.error.flatten());
    const message = await prisma.contactMessage.create({ data: parsed.data });
    res.status(201).json({ message });
  })
);

router.get(
  "/contact",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ messages });
  })
);

router.patch(
  "/contact/:id",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const schema = z.object({ handled: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid request");
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { handled: parsed.data.handled },
    });
    res.json({ message });
  })
);

export default router;
