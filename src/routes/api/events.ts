import { createFileRoute } from "@tanstack/react-router";
import { handleEventRequest } from "@/lib/qualifi-request-storage.server";

// Do not report an accepted event while no persistent event store exists.
export const Route = createFileRoute("/api/events")({
  server: { handlers: { POST: () => handleEventRequest() } },
});
