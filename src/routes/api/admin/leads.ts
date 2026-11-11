import { createFileRoute } from "@tanstack/react-router";
import { searchLeads, updateLead } from "@/lib/lead-admin.server";

export const Route = createFileRoute("/api/admin/leads")({
  server: {
    handlers: {
      POST: ({ request }) => searchLeads(request),
      PATCH: ({ request }) => updateLead(request),
    },
  },
});
