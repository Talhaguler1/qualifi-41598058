import { describe, expect, it, vi } from 'vitest';
import { handleLeadRequest, handleEventRequest, type RequestStore } from '../lib/qualifi-request-storage.server';
import { parseLead } from '../lib/qualifi-submission';
const input={id:'62558306-7115-4d67-b7d3-4c31cfa46a2c',email:' Test@Example.invalid ',consent:true,kind:'waitlist',solution:'autopilot',context:{pagePath:'/tr/tahsilat-takibi',campaignId:'collections',segment:'finance',locale:'tr',analyticsConsent:false,visitorId:null}};
const request=(value:unknown)=>new Request('https://qualifilab.com/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
const store=():RequestStore=>({lead:vi.fn().mockResolvedValue({id:input.id,duplicate:true}),event:vi.fn().mockResolvedValue(undefined)});
describe('persistent submission rules',()=>{
 it('analytics opt-out retains request but not visitor association',()=>{expect(parseLead({...input,context:{...input.context,visitorId:input.id}})).toMatchObject({email:'test@example.invalid',analytics_consent:false,visitor_id:null,page_id:'collections:tr'});});
 it('duplicates return 200 and existing id',async()=>{const response=await handleLeadRequest(request(input),store());expect(response.status).toBe(200);expect(await response.json()).toMatchObject({id:input.id,duplicate:true});});
 it('storage failure returns 503 rather than a saved reference',async()=>{const s=store();vi.mocked(s.lead).mockRejectedValue(new Error('failure'));const r=await handleLeadRequest(request(input),s);expect(r.status).toBe(503);expect(await r.json()).toEqual({error:'database_unavailable'});});
 it('uploaded files are explicitly rejected before insertion',async()=>{const s=store();const r=await handleLeadRequest(request({...input,fileMode:'upload'}),s);expect(r.status).toBe(400);expect(await r.json()).toEqual({error:'uploads_unavailable'});expect(s.lead).not.toHaveBeenCalled();});
 it('forged page metadata is rejected',async()=>{expect((await handleLeadRequest(request({...input,context:{...input.context,segment:'banks'}}),store())).status).toBe(400);});
 it('client cannot produce confirmed success events',async()=>{const s=store();const r=await handleEventRequest(request({id:input.id,event:'waitlist_joined',context:{...input.context,analyticsConsent:true,visitorId:input.id}}),s);expect(r.status).toBe(400);expect(s.event).not.toHaveBeenCalled();});
 it('analytics without consent is not persisted',async()=>{const s=store();expect((await handleEventRequest(request({id:input.id,event:'landing_viewed',context:input.context}),s)).status).toBe(400);expect(s.event).not.toHaveBeenCalled();});
 it('contact text in analytics properties is rejected',async()=>{const s=store();expect((await handleEventRequest(request({id:input.id,event:'landing_viewed',context:{...input.context,analyticsConsent:true,visitorId:input.id},properties:{email:'contact@example.invalid'}}),s)).status).toBe(400);expect(s.event).not.toHaveBeenCalled();});
});