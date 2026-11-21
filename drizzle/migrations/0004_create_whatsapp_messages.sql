CREATE TABLE public.qualifi_whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wa_message_id text UNIQUE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  contact_wa_id text NOT NULL CHECK (char_length(contact_wa_id) <= 32),
  contact_name text CHECK (char_length(contact_name) <= 100),
  body text NOT NULL CHECK (char_length(body) <= 4096),
  intent text CHECK (intent IN ('promise','paid','refuse','question','other')),
  commitment_id uuid REFERENCES public.qualifi_commitments(id) ON DELETE SET NULL,
  previous_due_date date,
  new_due_date date,
  ai_summary text CHECK (char_length(ai_summary) <= 400),
  confidence numeric CHECK (confidence BETWEEN 0 AND 1),
  reply_draft text CHECK (char_length(reply_draft) <= 1000),
  reply_state text NOT NULL DEFAULT 'none' CHECK (reply_state IN ('none','waiting','sent','dismissed','failed')),
  delivery_status text CHECK (delivery_status IN ('sent','delivered','read','failed')),
  error text CHECK (char_length(error) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX qualifi_whatsapp_messages_user_created_idx ON public.qualifi_whatsapp_messages (user_id, created_at DESC);
REVOKE ALL ON public.qualifi_whatsapp_messages FROM anon, authenticated;
GRANT SELECT ON public.qualifi_whatsapp_messages TO authenticated;
GRANT ALL ON public.qualifi_whatsapp_messages TO service_role;
ALTER TABLE public.qualifi_whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_or_admin_read ON public.qualifi_whatsapp_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.qualifi_is_admin());

CREATE OR REPLACE FUNCTION public.qualifi_delete_my_workspace()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c int; f int; w int; BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  DELETE FROM public.qualifi_whatsapp_messages WHERE user_id = auth.uid(); GET DIAGNOSTICS w = ROW_COUNT;
  DELETE FROM public.qualifi_commitments WHERE user_id = auth.uid(); GET DIAGNOSTICS c = ROW_COUNT;
  DELETE FROM public.qualifi_workspace_files WHERE user_id = auth.uid(); GET DIAGNOSTICS f = ROW_COUNT;
  RETURN jsonb_build_object('commitments', c, 'files', f, 'whatsapp', w);
END $function$;