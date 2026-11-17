import demoCss from "@/styles/demo-app.css?url";

export function demoHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | QualiFi demo` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | QualiFi demo` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: demoCss },
    ],
  };
}
