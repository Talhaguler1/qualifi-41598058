import { createFileRoute } from "@tanstack/react-router";
import { handleDemoActivity, withAccountsDeps } from "@/lib/accounts.server";

export const Route = createFileRoute("/api/admin/demo-activity")({
  server: { handlers: { GET: ({ request }) => withAccountsDeps(request, (r, d) => handleDemoActivity(r, d)) } },
});
