export function serializeDecimals(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(serializeDecimals);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const isDecimal = typeof value.toFixed === "function" && typeof value.toNumber === "function";
    if (isDecimal) return value.toFixed(2);
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = serializeDecimals(child);
    return out;
  }
  return value;
}

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
