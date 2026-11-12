var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.js
var DEFAULT_SITE_URL = "https://organic.cholonbil.workers.dev";
var DEFAULT_API_URL = "https://organic-shop-jf8z.onrender.com/api";
var STATIC_PATHS = [
  "/",
  "/shop",
  "/about",
  "/faq",
  "/returns",
  "/privacy",
  "/terms",
  "/contact"
];
function absoluteUrl(value, fallback) {
  const base = (value || fallback).trim();
  const withProtocol = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  return withProtocol.replace(/\/+$/, "");
}
__name(absoluteUrl, "absoluteUrl");
function siteUrl(env) {
  return absoluteUrl(env.SITE_URL || env.CF_PAGES_URL, DEFAULT_SITE_URL);
}
__name(siteUrl, "siteUrl");
function apiUrl(env) {
  const configured = (env.SITEMAP_API_URL || env.VITE_API_URL || env.API_URL || DEFAULT_API_URL).trim();
  if (configured.startsWith("/")) return `${siteUrl(env)}${configured.replace(/\/+$/, "")}`;
  return absoluteUrl(configured, DEFAULT_API_URL);
}
__name(apiUrl, "apiUrl");
async function fetchJson(url, timeout = 45e3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
__name(fetchJson, "fetchJson");
async function fetchCategories(baseUrl) {
  const data = await fetchJson(`${baseUrl}/categories?flat=1`);
  return Array.isArray(data.categories) ? data.categories : [];
}
__name(fetchCategories, "fetchCategories");
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
__name(fetchProducts, "fetchProducts");
function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
__name(escapeXml, "escapeXml");
function lastModified(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
__name(lastModified, "lastModified");
function latestDate(dates) {
  return dates.filter(Boolean).map((value) => new Date(value)).filter((value) => !Number.isNaN(value.getTime())).sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() || null;
}
__name(latestDate, "latestDate");
function buildSitemap(entries) {
  const urls = [...entries.entries()].map(([loc, lastmod]) => {
    const lastmodTag = lastmod ? `
    <lastmod>${lastmod}</lastmod>` : "";
    return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmodTag}
  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
__name(buildSitemap, "buildSitemap");
async function sitemapResponse(env) {
  const baseUrl = apiUrl(env);
  const origin = siteUrl(env);
  const [categories, products] = await Promise.all([
    fetchCategories(baseUrl),
    fetchProducts(baseUrl)
  ]);
  const productLastmods = products.map((product) => lastModified(product.updatedAt));
  const categoryLastmods = categories.map((category) => lastModified(category.updatedAt));
  const catalogueLastmod = latestDate([...productLastmods, ...categoryLastmods]);
  const entries = /* @__PURE__ */ new Map();
  const add = /* @__PURE__ */ __name((path, lastmod = null) => {
    const loc = `${origin}${path}`;
    const current = entries.get(loc) || null;
    if (!entries.has(loc)) {
      entries.set(loc, lastmod);
    } else if (lastmod && (!current || new Date(lastmod) > new Date(current))) {
      entries.set(loc, lastmod);
    }
  }, "add");
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
__name(sitemapResponse, "sitemapResponse");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml") {
      try {
        const xml = await sitemapResponse(env);
        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
          }
        });
      } catch (error) {
        console.error("Unable to generate sitemap", error);
        return new Response("Sitemap temporarily unavailable", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store"
          }
        });
      }
    }
    return env.ASSETS.fetch(request);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-aTjlgu/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-aTjlgu/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
