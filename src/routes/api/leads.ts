import { createFileRoute } from "@tanstack/react-router";

// Form requests are acknowledged; persistent storage is not connected yet.
export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { email?: string; consent?: boolean; website?: string } | null;
        if (!body || body.website || !body.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email ?? ""))
          return Response.json({ error: "invalid_submission" }, { status: 400 });
        return Response.json({ ok: true, id: crypto.randomUUID() }, { status: 201 });
      },
    },
  },
});
