import { createFileRoute } from "@tanstack/react-router";
import { createDemoInteractionStore, handleDemoInteraction } from "@/lib/demo-interactions.server";

export const Route = createFileRoute("/api/demo-interactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          return await handleDemoInteraction(request, await createDemoInteractionStore());
        } catch (error) {
          console.error("demo interaction failed", error);
          return Response.json({ error: "storage_unavailable" }, { status: 503 });
        }
      },
    },
  },
});
