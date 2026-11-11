import { createFileRoute } from "@tanstack/react-router";
import { exportLeads } from "@/lib/lead-admin.server";

export const Route = createFileRoute("/api/admin/leads/export")({
  server: { handlers: { POST: ({ request }) => exportLeads(request) } },
});
