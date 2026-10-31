import crypto from "crypto";
import { HttpError } from "../lib/http.js";

export function buildUploadSignature({ folder = "organic-shop", publicId } = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new HttpError(500, "Cloudinary is not configured");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  if (publicId) params.public_id = publicId;
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
  return { cloudName, apiKey, signature, timestamp, folder, publicId };
}
