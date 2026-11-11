import { createFileRoute } from "@tanstack/react-router";

// Analytics events are accepted but not stored yet.
export const Route = createFileRoute("/api/events")({
  server: { handlers: { POST: () => Response.json({ ok: true }) } },
});
