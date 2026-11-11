import { z } from 'zod';
import { PAGE_CONFIG } from './qualifi-page-config';

const contextSchema = z.object({ pagePath: z.string().max(150), locale: z.enum(['tr','en']), segment: z.string().max(30), campaignId: z.string().max(40).optional(), analyticsConsent: z.boolean(), visitorId: z.string().uuid().nullable().optional() }).passthrough();
const inputSchema = z.object({ id: z.string().uuid(), email: z.string().trim().toLowerCase().email().max(254), consent: z.literal(true), website: z.string().max(0).optional(), kind: z.enum(['waitlist','pilot','meeting']), company: z.string().trim().max(200).optional(), solution: z.enum(['forecast','autopilot','risk']), fileMode: z.enum(['sample','upload']).optional(), contract: z.unknown().optional(), context: contextSchema });
const source = z.string().regex(/^[a-zA-Z0-9_. -]{1,100}$/);
export function parseContext(value: unknown) {
  const context = contextSchema.parse(value);
  const page = Object.entries(PAGE_CONFIG).find(([path]) => path === context.pagePath)?.[1];
  if (!page || page.locale !== context.locale || page.segment !== context.segment || (page.campaignId ?? undefined) !== context.campaignId) throw new Error('invalid_submission');
  if (context.analyticsConsent && !context.visitorId) throw new Error('invalid_submission');
  return { context, page };
}
export function parseLead(value: unknown) {
  const input = inputSchema.parse(value);
  const { context, page } = parseContext(input.context);
  if (!(page.solutions as readonly string[]).includes(input.solution) || !(page.kinds as readonly string[]).includes(input.kind)) throw new Error('invalid_submission');
  if (input.fileMode === 'upload' || input.contract != null) throw new Error('uploads_unavailable');
  const attribution = Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content'].map(key => {
    const parsed = source.safeParse(context[key]);
    return [key, parsed.success ? parsed.data : null];
  }));
  return { id: input.id, email: input.email, company: input.company || null, kind: input.kind, page_id: page.pageId, campaign_id: page.campaignId, locale: page.locale, segment: page.segment, solution: input.solution, analytics_consent: context.analyticsConsent, visitor_id: context.analyticsConsent ? context.visitorId : null, ...attribution };
}
const events = ['landing_viewed','primary_cta_clicked','lead_form_started','contract_selected','calendar_opened','solution_viewed','solution_selected','outcome_selected','agent_cta_clicked','lead_form_opened','agent_setup_started','channel_preference_selected'] as const;
export function parseEvent(value: unknown) {
  const input = z.object({ id: z.string().uuid(), event: z.enum(events), context: contextSchema, properties: z.record(z.unknown()).default({}) }).parse(value);
  const { context, page } = parseContext(input.context);
  if (!context.analyticsConsent || !context.visitorId) throw new Error('analytics_consent_required');
  const allowed: Record<string, readonly string[]> = { solution: page.solutions, position: ['hero','nav','dialog','bottom','1','2'], cta: ['agent','pilot','meeting','waitlist'], fileMode: ['upload','sample'], channel: ['email','whatsapp','both','none'] };
  const properties: Record<string,string> = {};
  for (const [key,value] of Object.entries(input.properties)) {
    if (typeof value !== 'string' || !allowed[key]?.includes(value)) throw new Error('invalid_submission');
    properties[key] = value;
  }
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
    const parsed = source.safeParse(context[key]);
    if (parsed.success) properties[key] = parsed.data;
  }
  return { id: input.id, event: input.event, page_id: page.pageId, locale: page.locale, visitor_id: context.visitorId, properties };
}