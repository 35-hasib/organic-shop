import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../lib/http.js";
import { buildUploadSignature } from "../services/cloudinary.js";

const router = Router();

router.post(
  "/signature",
  authRequired,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const payload = buildUploadSignature({
      folder: req.body?.folder || "organic-shop",
      publicId: req.body?.publicId,
    });
    res.json({
      endpoint: `https://api.cloudinary.com/v1_1/${payload.cloudName}/auto/upload`,
      ...payload,
    });
  })
);

export default router;
