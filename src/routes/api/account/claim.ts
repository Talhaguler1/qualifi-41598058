import { createFileRoute } from "@tanstack/react-router";
import { createClaimDeps, handleClaim } from "@/lib/account-claim.server";

export const Route = createFileRoute("/api/account/claim")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!/^Bearer \S+$/.test(request.headers.get("Authorization") ?? "")) return Response.json({ error: "authentication_required" }, { status: 401 });
        try {
          return await handleClaim(request, await createClaimDeps());
        } catch (error) {
          console.error("account claim failed", error);
          return Response.json({ error: "storage_unavailable" }, { status: 503 });
        }
      },
    },
  },
});
