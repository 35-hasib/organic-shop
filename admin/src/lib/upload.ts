import { api } from "./api";

interface Signature {
  endpoint: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  publicId?: string;
}

export async function uploadImage(file: File, folder = "organic-shop/products") {
  const signature = await api<Signature>("/uploads/signature", { method: "POST", body: { folder } });
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signature.apiKey);
  body.append("timestamp", String(signature.timestamp));
  body.append("signature", signature.signature);
  body.append("folder", signature.folder);
  if (signature.publicId) body.append("public_id", signature.publicId);
  const response = await fetch(signature.endpoint, { method: "POST", body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Image upload failed");
  return data.secure_url as string;
}
