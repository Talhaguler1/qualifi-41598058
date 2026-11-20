import { createFileRoute } from "@tanstack/react-router";
import { handleReply } from "@/lib/whatsapp.server";

// The owner approves (sends) or dismisses a reply the agent drafted.
export const Route = createFileRoute("/api/whatsapp/reply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const deps = await import("@/lib/whatsapp-deps.server");
        const env = deps.readEnv();
        if (!env.token || !env.phoneNumberId)
          return Response.json(
            { error: "config_error", message: "WhatsApp bağlantısı yapılandırılmamış." },
            { status: 503 },
          );
        try {
          return await handleReply(request, {
            store: deps.createReplyStore(),
            send: (to, text) => deps.sendText(env, to, text),
          });
        } catch (error) {
          console.error("whatsapp reply failed", error);
          return Response.json(
            { error: "unavailable", message: "Hizmet şu anda kullanılamıyor." },
            { status: 503 },
          );
        }
      },
    },
  },
});
