import { PAGES } from "./qualifi-pages";
import { enhancePage, SITEMAP_PATHS } from "./qualifi-enhance";

const cache = new Map<string, string>();

function page(route: string): string | undefined {
  const html = PAGES[route];
  if (!html) return undefined;
  let out = cache.get(route);
  if (!out) {
    out = enhancePage(route, html);
    cache.set(route, out);
  }
  return out;
}

/** Visitors whose browser prefers Turkish land on the Turkish home page instead of the English root. */
export function prefersTurkish(acceptLanguage: string | null): boolean {
  const first = (acceptLanguage ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("tr");
}

export function servePage(pathname: string, request?: Request): Response {
  const route = pathname.replace(/\/$/, "") || "/";
  const key = route === "/index.html" ? "/" : route === "/tr.html" ? "/tr" : route;
  if (key === "/" && request && prefersTurkish(request.headers.get("Accept-Language"))) {
    return new Response(null, { status: 302, headers: { Location: "/isletmeler", Vary: "Accept-Language" } });
  }
  const html = page(key);
  if (!html) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", ...(key === "/" ? { Vary: "Accept-Language" } : {}) } });
}

export function sitemapXml(origin: string): string {
  const urls = SITEMAP_PATHS.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
