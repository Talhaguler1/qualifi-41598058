import { createFileRoute } from "@tanstack/react-router";
import { servePage } from "@/lib/qualifi-serve";

export const Route = createFileRoute("/$")({
  server: { handlers: { GET: ({ request }) => servePage(new URL(request.url).pathname) } },
  component: () => null,
});
