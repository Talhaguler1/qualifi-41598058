import { parseLead, parseEvent } from './qualifi-submission';
type Saved = { id: string; duplicate: boolean };
export interface RequestStore {
  lead(value: ReturnType<typeof parseLead>): Promise<Saved>;
  event(value: ReturnType<typeof parseEvent>): Promise<void>;
}
const realStore: RequestStore = {
  async lead(value) {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const result = await supabaseAdmin.rpc('qualifi_save_lead', { p: value });
    if (result.error) throw new Error(result.error.message.includes('request_id_conflict') ? 'request_id_conflict' : 'database_unavailable');
    const data = result.data as unknown as Saved;
    if (!data?.id || typeof data.duplicate !== 'boolean') throw new Error('database_unavailable');
    return data;
  },
  async event(value) {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const result = await supabaseAdmin.from('qualifi_events').insert(value);
    if (result.error && result.error.code !== '23505') throw new Error('database_unavailable');
  },
};
const json = (value: unknown, status: number) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
async function body(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) throw new Error('origin_not_allowed');
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('invalid_submission');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_submission');
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length; if (size > 8192) { await reader.cancel(); throw new Error('uploads_unavailable'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
function invalid(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return json({ error: ['uploads_unavailable','analytics_consent_required','origin_not_allowed'].includes(message) ? message : 'invalid_submission' }, message === 'origin_not_allowed' ? 403 : 400);
}
export async function handleLeadRequest(request: Request, store: RequestStore = realStore): Promise<Response> {
  let value;
  try { value = parseLead(await body(request)); } catch (error) { return invalid(error); }
  try {
    const saved = await store.lead(value);
    if (!saved.duplicate) {
      try {
        const { sendTemplateEmail } = await import('./email-templates/send-email');
        await sendTemplateEmail('owner-request', '', { templateData: { page: value.page_id, kind: value.kind }, idempotencyKey: `owner-request-${saved.id}` });
      } catch { /* Saved requests remain available in the inbox if notification fails. */ }
    }
    return json({ ok: true, ...saved }, saved.duplicate ? 200 : 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'request_id_conflict') return json({ error: 'request_id_conflict' }, 409);
    return json({ error: 'database_unavailable' }, 503);
  }
}
export async function handleEventRequest(request?: Request, store: RequestStore = realStore): Promise<Response> {
  if (!request) return json({ error: 'storage_not_configured' }, 503);
  let value;
  try { value = parseEvent(await body(request)); } catch (error) { return invalid(error); }
  try { await store.event(value); return json({ ok: true }, 201); }
  catch { return json({ error: 'database_unavailable' }, 503); }
}
