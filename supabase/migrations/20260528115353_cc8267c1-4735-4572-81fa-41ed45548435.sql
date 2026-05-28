
-- 1. Private schema for sensitive/audit data
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated, public;

-- 2. Lock down SECURITY DEFINER functions: revoke from anon/public, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.calcular_primeira_resposta_vendedor() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_handoff() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_lead_captado() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpis(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_ranking_velocidade_vendedores(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_leads_aguardando_resposta() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_funil_data(integer) FROM anon, public;

-- 3. Harden KPI/analytics RPCs with role check + keep search_path fixed
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(periodo_dias integer DEFAULT 30)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE resultado JSON;
  data_inicio TIMESTAMPTZ := now() - (periodo_dias || ' days')::INTERVAL;
  data_inicio_anterior TIMESTAMPTZ := now() - (periodo_dias * 2 || ' days')::INTERVAL;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF public.get_user_role() NOT IN ('gestor','admin') THEN
    RAISE EXCEPTION 'Acesso negado: KPIs globais restritos a gestor/admin';
  END IF;
  SELECT json_build_object(
    'leads_captados', (SELECT COUNT(*) FROM public.leads WHERE criado_em >= data_inicio),
    'leads_captados_anterior', (SELECT COUNT(*) FROM public.leads WHERE criado_em >= data_inicio_anterior AND criado_em < data_inicio),
    'taxa_resposta', (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status NOT IN ('bruto','abordado')) / NULLIF(COUNT(*) FILTER (WHERE status != 'bruto'), 0), 1) FROM public.leads WHERE criado_em >= data_inicio),
    'taxa_qualificacao', (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('qualificado','negociacao','ganho')) / NULLIF(COUNT(*) FILTER (WHERE status = 'respondeu'), 0), 1) FROM public.leads WHERE criado_em >= data_inicio),
    'conversao_final', (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'ganho') / NULLIF(COUNT(*) FILTER (WHERE status IN ('qualificado','negociacao','ganho')), 0), 1) FROM public.leads WHERE criado_em >= data_inicio),
    'ticket_medio', (SELECT ROUND(AVG(valor_estimado), 2) FROM public.leads WHERE status = 'ganho' AND criado_em >= data_inicio),
    'tempo_medio_resposta_segundos', (SELECT ROUND(AVG(tempo_primeira_resposta_segundos)) FROM public.leads WHERE tempo_primeira_resposta_segundos IS NOT NULL AND handoff_em >= data_inicio),
    'tempo_medio_resposta_anterior', (SELECT ROUND(AVG(tempo_primeira_resposta_segundos)) FROM public.leads WHERE tempo_primeira_resposta_segundos IS NOT NULL AND handoff_em >= data_inicio_anterior AND handoff_em < data_inicio)
  ) INTO resultado;
  RETURN resultado;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_ranking_velocidade_vendedores(periodo_dias integer DEFAULT 30)
RETURNS TABLE(vendedor_id uuid, nome text, avatar_url text, tempo_medio_segundos integer, total_respostas integer, taxa_excelencia numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF public.get_user_role() NOT IN ('gestor','admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  RETURN QUERY
  SELECT p.id, p.nome, p.avatar_url,
    ROUND(AVG(l.tempo_primeira_resposta_segundos))::INT,
    COUNT(*)::INT,
    ROUND(100.0 * COUNT(*) FILTER (WHERE l.tempo_primeira_resposta_segundos <= 1800) / NULLIF(COUNT(*), 0), 1)
  FROM public.leads l JOIN public.profiles p ON p.id = l.vendedor_id
  WHERE l.tempo_primeira_resposta_segundos IS NOT NULL
    AND l.handoff_em >= now() - (periodo_dias || ' days')::INTERVAL
  GROUP BY p.id, p.nome, p.avatar_url
  ORDER BY AVG(l.tempo_primeira_resposta_segundos) ASC;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_leads_aguardando_resposta()
RETURNS TABLE(lead_id uuid, razao_social text, vendedor_id uuid, vendedor_nome text, vendedor_avatar text, handoff_em timestamp with time zone, segundos_aguardando integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF public.get_user_role() NOT IN ('gestor','admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  RETURN QUERY
  SELECT l.id, l.razao_social, p.id, p.nome, p.avatar_url, l.handoff_em,
    EXTRACT(EPOCH FROM (now() - l.handoff_em))::INT
  FROM public.leads l LEFT JOIN public.profiles p ON p.id = l.vendedor_id
  WHERE l.handoff_em IS NOT NULL AND l.primeira_resposta_vendedor_em IS NULL
    AND l.status IN ('qualificado','negociacao')
  ORDER BY l.handoff_em ASC;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_funil_data(periodo_dias integer DEFAULT 30)
RETURNS TABLE(status lead_status, total bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF public.get_user_role() NOT IN ('gestor','admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  RETURN QUERY
  SELECT l.status, COUNT(*) FROM public.leads l
  WHERE l.criado_em >= now() - (periodo_dias || ' days')::INTERVAL
  GROUP BY l.status
  ORDER BY array_position(ARRAY['bruto','abordado','respondeu','qualificado','negociacao','ganho','perdido']::lead_status[], l.status);
END; $function$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking_velocidade_vendedores(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leads_aguardando_resposta() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_funil_data(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- 4. Audit trail (private schema) — role changes on profiles
CREATE TABLE IF NOT EXISTS private.audit_role_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_role text,
  new_role text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  context jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE private.audit_role_changes ENABLE ROW LEVEL SECURITY;
-- No grants: only service_role / SECURITY DEFINER funcs can access.

CREATE OR REPLACE FUNCTION private.log_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO private.audit_role_changes (user_id, old_role, new_role, changed_by, context)
    VALUES (NEW.id, OLD.role::text, NEW.role::text, auth.uid(),
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION private.log_role_change() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_audit_role_change ON public.profiles;
CREATE TRIGGER trg_audit_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.log_role_change();

-- Extra guard: block non-admin from changing roles at all (RLS already enforces but add hard trigger)
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(public.get_user_role()::text, '') <> 'admin' THEN
    RAISE EXCEPTION 'Apenas admin pode alterar role';
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 5. LGPD — opt-out e solicitações de titular
CREATE TABLE IF NOT EXISTS public.lead_consentimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  opt_out boolean NOT NULL DEFAULT false,
  consentimento_em timestamptz,
  opt_out_em timestamptz,
  origem text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);
GRANT SELECT, INSERT, UPDATE ON public.lead_consentimentos TO authenticated;
GRANT ALL ON public.lead_consentimentos TO service_role;
ALTER TABLE public.lead_consentimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_read ON public.lead_consentimentos FOR SELECT TO authenticated
USING (
  public.get_user_role() IN ('gestor','admin')
  OR EXISTS (SELECT 1 FROM public.leads l
             WHERE l.id = lead_id AND (l.vendedor_id = auth.uid() OR l.vendedor_id IS NULL))
);
CREATE POLICY consent_write ON public.lead_consentimentos FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role() IN ('gestor','admin')
  OR EXISTS (SELECT 1 FROM public.leads l
             WHERE l.id = lead_id AND l.vendedor_id = auth.uid())
);
CREATE POLICY consent_update ON public.lead_consentimentos FOR UPDATE TO authenticated
USING (
  public.get_user_role() IN ('gestor','admin')
  OR EXISTS (SELECT 1 FROM public.leads l
             WHERE l.id = lead_id AND l.vendedor_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.lgpd_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('acesso','exportacao','exclusao','retificacao')),
  titular_email text NOT NULL,
  titular_documento text,
  lead_id uuid,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluida','rejeitada')),
  detalhes text,
  solicitada_em timestamptz NOT NULL DEFAULT now(),
  resolvida_em timestamptz,
  resolvida_por uuid
);
GRANT SELECT, INSERT, UPDATE ON public.lgpd_solicitacoes TO authenticated;
GRANT ALL ON public.lgpd_solicitacoes TO service_role;
ALTER TABLE public.lgpd_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY lgpd_admin_all ON public.lgpd_solicitacoes FOR ALL TO authenticated
USING (public.get_user_role() IN ('gestor','admin'))
WITH CHECK (public.get_user_role() IN ('gestor','admin'));
