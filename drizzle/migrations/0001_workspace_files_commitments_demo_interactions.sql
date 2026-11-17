CREATE TABLE public.qualifi_workspace_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('contract','invoice_image','spreadsheet','whatsapp')),
  storage_path text NOT NULL,
  original_name text NOT NULL CHECK (char_length(original_name) <= 255),
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','extracted','failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX qualifi_workspace_files_user_idx ON public.qualifi_workspace_files(user_id);

CREATE TABLE public.qualifi_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  file_id uuid REFERENCES public.qualifi_workspace_files(id) ON DELETE SET NULL,
  counterparty text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'TRY',
  due_date date,
  kind text NOT NULL CHECK (kind IN ('invoice','contract_installment','promise','expense')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid')),
  paid_at date,
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  evidence text CHECK (char_length(evidence) <= 500),
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX qualifi_commitments_user_idx ON public.qualifi_commitments(user_id);

CREATE TABLE public.qualifi_demo_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id uuid NOT NULL,
  panel text NOT NULL CHECK (panel IN ('business','bank')),
  tenant text NOT NULL CHECK (char_length(tenant) <= 20),
  demo_date date NOT NULL,
  action text NOT NULL CHECK (action IN ('agent_approve','agent_edit','agent_snooze','agent_question','scenario_run','date_change','customer_open','firm_open','tab_open')),
  target text CHECK (char_length(target) <= 120),
  detail text CHECK (char_length(detail) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX qualifi_demo_interactions_session_idx ON public.qualifi_demo_interactions(session_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.qualifi_workspace_files TO authenticated;
GRANT ALL ON public.qualifi_workspace_files TO service_role;
GRANT SELECT, INSERT, DELETE ON public.qualifi_commitments TO authenticated;
GRANT ALL ON public.qualifi_commitments TO service_role;
GRANT SELECT ON public.qualifi_demo_interactions TO authenticated;
GRANT ALL ON public.qualifi_demo_interactions TO service_role;

ALTER TABLE public.qualifi_workspace_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifi_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifi_demo_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_or_admin_read ON public.qualifi_workspace_files FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.qualifi_is_admin());
CREATE POLICY own_insert ON public.qualifi_workspace_files FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY own_delete ON public.qualifi_workspace_files FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY own_or_admin_read ON public.qualifi_commitments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.qualifi_is_admin());
CREATE POLICY own_insert ON public.qualifi_commitments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND (file_id IS NULL OR EXISTS (SELECT 1 FROM public.qualifi_workspace_files f WHERE f.id = file_id AND f.user_id = auth.uid())));
CREATE POLICY own_delete ON public.qualifi_commitments FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY admin_read ON public.qualifi_demo_interactions FOR SELECT TO authenticated USING (public.qualifi_is_admin());

CREATE OR REPLACE FUNCTION public.qualifi_delete_my_workspace()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c int; f int; BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  DELETE FROM public.qualifi_commitments WHERE user_id = auth.uid(); GET DIAGNOSTICS c = ROW_COUNT;
  DELETE FROM public.qualifi_workspace_files WHERE user_id = auth.uid(); GET DIAGNOSTICS f = ROW_COUNT;
  RETURN jsonb_build_object('commitments', c, 'files', f);
END $$;
REVOKE ALL ON FUNCTION public.qualifi_delete_my_workspace() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.qualifi_delete_my_workspace() TO authenticated;

CREATE POLICY workspace_files_own_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'workspace-files' AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) IN ('pdf','png','jpg','jpeg','xlsx','csv','txt'));
CREATE POLICY workspace_files_own_or_admin_read ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'workspace-files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.qualifi_is_admin()));
CREATE POLICY workspace_files_own_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'workspace-files' AND (storage.foldername(name))[1] = auth.uid()::text);