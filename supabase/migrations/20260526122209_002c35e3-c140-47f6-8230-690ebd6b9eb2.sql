
-- 1) Enable RLS + admin-only policies on backend tables
ALTER TABLE public.conversation_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversation_memory_admin_all ON public.conversation_memory
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin'::user_role)
  WITH CHECK (public.get_user_role() = 'admin'::user_role);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY stores_admin_all ON public.stores
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin'::user_role)
  WITH CHECK (public.get_user_role() = 'admin'::user_role);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_admin_all ON public.vendors
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin'::user_role)
  WITH CHECK (public.get_user_role() = 'admin'::user_role);

ALTER TABLE public.transfer_flow_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY transfer_flow_audit_admin_read ON public.transfer_flow_audit
  FOR SELECT TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::user_role, 'gestor'::user_role]));

ALTER TABLE public.transfer_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY transfer_locks_admin_all ON public.transfer_locks
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin'::user_role)
  WITH CHECK (public.get_user_role() = 'admin'::user_role);

ALTER TABLE public.vendor_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_queue_admin_all ON public.vendor_queue
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin'::user_role)
  WITH CHECK (public.get_user_role() = 'admin'::user_role);

ALTER TABLE public.message_buffer ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_buffer_admin_all ON public.message_buffer
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin'::user_role)
  WITH CHECK (public.get_user_role() = 'admin'::user_role);

-- 2) Prevent privilege escalation: block self-update of role/status
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role   = (SELECT role   FROM public.profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
  );

-- 3) Restrict unassigned leads to gestor/admin
DROP POLICY IF EXISTS leads_read ON public.leads;
CREATE POLICY leads_read ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = ANY (ARRAY['gestor'::user_role, 'admin'::user_role])
    OR vendedor_id = auth.uid()
  );

-- 4) Restrict direct inserts on eventos_feed (triggers run as SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS eventos_write ON public.eventos_feed;
CREATE POLICY eventos_write ON public.eventos_feed
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = ANY (ARRAY['gestor'::user_role, 'admin'::user_role]));

-- 5) Set fixed search_path on legacy functions
ALTER FUNCTION public.pop_ready_messages(integer)        SET search_path = public;
ALTER FUNCTION public.notify_process_messages()          SET search_path = public;
ALTER FUNCTION public.upsert_message_buffer(text, text, text, jsonb, integer) SET search_path = public;
ALTER FUNCTION public.pop_specific_chat(text)            SET search_path = public;
ALTER FUNCTION public.acquire_transfer_lock(text, integer) SET search_path = public;

-- 6) Revoke execute on internal/backend-only functions from anon and authenticated
REVOKE EXECUTE ON FUNCTION public.pop_ready_messages(integer)        FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_process_messages()          FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.upsert_message_buffer(text, text, text, jsonb, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.pop_specific_chat(text)            FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.acquire_transfer_lock(text, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                  FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calcular_primeira_resposta_vendedor() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.registrar_handoff()                FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.on_lead_captado()                  FROM anon, authenticated, public;
