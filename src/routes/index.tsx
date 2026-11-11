import { createFileRoute } from "@tanstack/react-router";
import { servePage } from "@/lib/qualifi-serve";

// QualiFi pages are pre-rendered HTML served directly.
export const Route = createFileRoute("/")({
  server: { handlers: { GET: ({ request }) => servePage(new URL(request.url).pathname) } },
  head: () => ({
    meta: [
      { title: "QualiFi" },
      { name: "description", content: "QualiFi finance agent pilot" },
      { property: "og:title", content: "QualiFi" },
      { property: "og:description", content: "QualiFi finance agent pilot" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => null,
});
