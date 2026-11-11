import { PAGES } from "./qualifi-pages";

export function servePage(pathname: string): Response {
  const route = pathname.replace(/\/$/, "") || "/";
  const html = PAGES[route === "/index.html" ? "/" : route === "/tr.html" ? "/tr" : route];
  if (!html) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
