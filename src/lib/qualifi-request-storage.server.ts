// The Lovable port has no persistent lead/event store yet. Never acknowledge
// a saved request until the database integration actually commits it.
function storageUnavailable(): Response {
  return Response.json(
    { error: "storage_not_configured" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function handleLeadRequest(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "invalid_submission" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (
    input["website"] ||
    input["consent"] !== true ||
    typeof input["email"] !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input["email"])
  ) {
    return Response.json({ error: "invalid_submission" }, { status: 400 });
  }
  return storageUnavailable();
}

export function handleEventRequest(): Response {
  return storageUnavailable();
}
