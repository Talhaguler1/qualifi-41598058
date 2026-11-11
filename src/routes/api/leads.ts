import { createFileRoute } from "@tanstack/react-router";
import { handleLeadRequest } from "@/lib/qualifi-request-storage.server";

// Persistent storage must be configured before requests can succeed.
export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      POST: ({ request }) => handleLeadRequest(request),
    },
  },
});
