import { createFileRoute } from "@tanstack/react-router";
import { handleExtract } from "@/lib/workspace-extract.server";

export const Route = createFileRoute("/api/workspace/extract")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "config_error", message: "Sunucu yapılandırması eksik." }, { status: 500 });
        try {
          // Open sign-up: cap AI document reads per account per day (admins exempt).
          const quota = await import("@/lib/account-claim.server");
          const limited = await quota.extractQuotaCheck(request, await quota.createExtractQuotaDeps());
          if (limited) return limited;
          const deps = await import("@/lib/workspace-extract-deps.server");
          const store = await deps.createExtractStore();
          return await handleExtract(request, { store, extract: deps.createExtractor(apiKey, request.signal), toText: deps.spreadsheetToText });
        } catch (error) {
          console.error("workspace extract route failed", error);
          return Response.json({ error: "storage_unavailable", message: "Hizmet şu anda kullanılamıyor." }, { status: 503 });
        }
      },
    },
  },
});
