import { createFileRoute } from "@tanstack/react-router";
import { handleCreateAccounts, handleListAccounts, withAccountsDeps } from "@/lib/accounts.server";

export const Route = createFileRoute("/api/admin/accounts")({
  server: {
    handlers: {
      GET: ({ request }) => withAccountsDeps(request, handleListAccounts),
      POST: ({ request }) => withAccountsDeps(request, handleCreateAccounts),
    },
  },
});
