import { createFileRoute } from "@tanstack/react-router";
import { handleEventRequest } from "@/lib/qualifi-request-storage.server";

export const Route = createFileRoute("/api/events")({
  server: { handlers: { POST: ({ request }) => handleEventRequest(request) } },
});
