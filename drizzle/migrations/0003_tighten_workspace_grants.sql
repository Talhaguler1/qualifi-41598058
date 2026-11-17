REVOKE ALL ON public.qualifi_commitments, public.qualifi_workspace_files, public.qualifi_demo_interactions FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.qualifi_workspace_files TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.qualifi_commitments TO authenticated;
GRANT UPDATE (amount, due_date, counterparty, status, paid_at, needs_review) ON public.qualifi_commitments TO authenticated;
GRANT SELECT ON public.qualifi_demo_interactions TO authenticated;