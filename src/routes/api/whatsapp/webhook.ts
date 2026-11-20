import { createFileRoute } from "@tanstack/react-router";
import { handleVerify, handleWebhook } from "@/lib/whatsapp.server";

// Meta WhatsApp Cloud API webhook. GET = subscription check, POST = messages and delivery statuses.
export const Route = createFileRoute("/api/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { readEnv } = await import("@/lib/whatsapp-deps.server");
        return handleVerify(new URL(request.url), readEnv().verifyToken);
      },
      POST: async ({ request }) => {
        const deps = await import("@/lib/whatsapp-deps.server");
        const env = deps.readEnv();
        if (!env.appSecret || !env.phoneNumberId || !env.ownerEmail || !env.aiKey) {
          console.error("whatsapp webhook: missing configuration");
          return new Response("not configured", { status: 503 });
        }
        try {
          return await handleWebhook(request, deps.createWebhookDeps(env));
        } catch (error) {
          console.error("whatsapp webhook failed", error);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
