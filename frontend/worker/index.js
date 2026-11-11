const DEFAULT_SITE_URL = "https://organic-shop-two.vercel.app";
const DEFAULT_API_URL = "https://organic-shop-jf8z.onrender.com/api";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/about",
  "/faq",
  "/returns",
  "/privacy",
  "/terms",
  "/contact",
];

function absoluteUrl(value, fallback) {
  const base = (value || fallback).trim();
  const withProtocol = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  return withProtocol.replace(/\/+$/, "");
}

function siteUrl(env) {
  return absoluteUrl(env.SITE_URL || env.CF_PAGES_URL, DEFAULT_SITE_URL);
}

function apiUrl(env) {
  const configured = (env.SITEMAP_API_URL || env.VITE_API_URL || env.API_URL || DEFAULT_API_URL).trim();
  if (configured.startsWith("/")) return `${siteUrl(env)}${configured.replace(/\/+$/, "")}`;
  return absoluteUrl(configured, DEFAULT_API_URL);
}

async function fetchJson(url, timeout = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCategories(baseUrl) {
  const data = await fetchJson(`${baseUrl}/categories?flat=1`);
  return Array.isArray(data.categories) ? data.categories : [];
}

async function fetchProducts(baseUrl) {
  const products = [];
  let page = 1;
  let total = 0;

  do {
    const data = await fetchJson(`${baseUrl}/products?pageSize=100&inStock=1&page=${page}`);
    const rows = Array.isArray(data.products) ? data.products : [];
    products.push(...rows);
    total = Number(data.total) || products.length;
    if (rows.length === 0) break;
    page += 1;
  } while (products.length < total && page <= 100);

  return products;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function lastModified(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function latestDate(dates) {
  return dates
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0]
    ?.toISOString() || null;
}

function buildSitemap(entries) {
  const urls = [...entries.entries()]
    .map(([loc, lastmod]) => {
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function sitemapResponse(env) {
  const baseUrl = apiUrl(env);
  const origin = siteUrl(env);
  const [categories, products] = await Promise.all([
    fetchCategories(baseUrl),
    fetchProducts(baseUrl),
  ]);

  const productLastmods = products.map((product) => lastModified(product.updatedAt));
  const categoryLastmods = categories.map((category) => lastModified(category.updatedAt));
  const catalogueLastmod = latestDate([...productLastmods, ...categoryLastmods]);

  const entries = new Map();
  const add = (path, lastmod = null) => {
    const loc = `${origin}${path}`;
    const current = entries.get(loc) || null;
    if (!entries.has(loc)) {
      entries.set(loc, lastmod);
    } else if (lastmod && (!current || new Date(lastmod) > new Date(current))) {
      entries.set(loc, lastmod);
    }
  };

  for (const path of STATIC_PATHS) {
    add(path, path === "/" || path === "/shop" ? catalogueLastmod : null);
  }

  for (const category of categories) {
    if (!category?.slug || category.active === false) continue;
    add(`/category/${encodeURIComponent(category.slug)}`, lastModified(category.updatedAt));
  }

  for (const product of products) {
    if (!product?.slug || product.published === false || product.stock <= 0) continue;
    add(`/product/${encodeURIComponent(product.slug)}`, lastModified(product.updatedAt));
  }

  return buildSitemap(entries);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/sitemap.xml") {
      try {
        const xml = await sitemapResponse(env);
        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      } catch (error) {
        console.error("Unable to generate sitemap", error);
        return new Response("Sitemap temporarily unavailable", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
