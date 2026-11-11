import { createFileRoute } from "@tanstack/react-router";
import { LeadsAdminPage } from "@/components/admin/leads-admin-page";
import adminCss from "@/styles/leads-admin.css?url";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Başvurular | QualiFi" },
      { name: "description", content: "QualiFi özel başvuru yönetimi." },
      { property: "og:title", content: "Başvurular | QualiFi" },
      { property: "og:description", content: "QualiFi özel başvuru yönetimi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: adminCss }],
  }),
  component: LeadsAdminPage,
});
