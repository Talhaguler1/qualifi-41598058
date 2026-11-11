import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/config")({
  server: { handlers: { GET: () => Response.json({ calendarUrl: "", maxFileBytes: 5242880, agentLive: false }) } },
});
