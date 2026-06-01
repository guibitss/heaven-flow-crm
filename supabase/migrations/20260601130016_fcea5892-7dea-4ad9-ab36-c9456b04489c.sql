
-- Função determinística de score (0-100) para leads
CREATE OR REPLACE FUNCTION public.calcular_score_lead(_lead public.leads)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_score numeric := 0;
  v_cnae_prefix text;
BEGIN
  -- CNAE (0-30): setores alinhados a solar pesam mais
  v_cnae_prefix := substring(coalesce(_lead.cnae, '') from 1 for 5);
  IF v_cnae_prefix IN ('35.11','35.14') THEN v_score := v_score + 30;     -- geração/distribuição energia
  ELSIF v_cnae_prefix IN ('43.21','43.22') THEN v_score := v_score + 25;  -- instalação elétrica
  ELSIF v_cnae_prefix IN ('71.12') THEN v_score := v_score + 20;          -- engenharia
  ELSIF v_cnae_prefix IN ('47.42','46.73') THEN v_score := v_score + 15;  -- comércio materiais
  ELSE v_score := v_score + 5;
  END IF;

  -- Capital social (0-25)
  v_score := v_score + LEAST(25, COALESCE(_lead.capital_social, 0) / 20000);

  -- Porte (0-20)
  v_score := v_score + CASE _lead.porte
    WHEN 'GRANDE' THEN 20
    WHEN 'MEDIA'  THEN 15
    WHEN 'EPP'    THEN 10
    WHEN 'ME'     THEN 5
    ELSE 0 END;

  -- Região (0-15): UFs com maior mercado solar
  v_score := v_score + CASE coalesce(_lead.endereco_uf, '')
    WHEN 'MG' THEN 15 WHEN 'SP' THEN 15 WHEN 'PR' THEN 13 WHEN 'RS' THEN 12
    WHEN 'SC' THEN 12 WHEN 'BA' THEN 11 WHEN 'GO' THEN 10 WHEN 'MT' THEN 10
    WHEN 'CE' THEN 9 WHEN 'PE' THEN 9
    ELSE 5 END;

  -- Completude do cadastro (0-10)
  IF _lead.telefone IS NOT NULL AND length(_lead.telefone) > 8 THEN v_score := v_score + 4; END IF;
  IF _lead.site IS NOT NULL THEN v_score := v_score + 3; END IF;
  IF _lead.decisor_nome IS NOT NULL THEN v_score := v_score + 3; END IF;

  RETURN GREATEST(0, LEAST(100, round(v_score)::int));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.calcular_score_lead(public.leads) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.calcular_score_lead(public.leads) TO authenticated;

-- Trigger: atualiza score, temperatura e porte na escrita
CREATE OR REPLACE FUNCTION public.aplicar_score_temperatura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_score int;
BEGIN
  -- Porte inferido por capital social quando ausente
  IF NEW.porte IS NULL THEN
    NEW.porte := CASE
      WHEN COALESCE(NEW.capital_social, 0) >= 4800000 THEN 'GRANDE'::lead_porte
      WHEN COALESCE(NEW.capital_social, 0) >= 360000  THEN 'MEDIA'::lead_porte
      WHEN COALESCE(NEW.capital_social, 0) >= 81000   THEN 'EPP'::lead_porte
      ELSE 'ME'::lead_porte END;
  END IF;

  v_score := public.calcular_score_lead(NEW);
  NEW.score := v_score;
  NEW.temperatura := CASE
    WHEN v_score >= 81 THEN 'quente'::lead_temperatura
    WHEN v_score >= 50 THEN 'morno'::lead_temperatura
    ELSE 'frio'::lead_temperatura END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_score_leads ON public.leads;
CREATE TRIGGER trg_score_leads
  BEFORE INSERT OR UPDATE OF cnae, capital_social, porte, endereco_uf, telefone, site, decisor_nome
  ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.aplicar_score_temperatura();

-- RPC admin para reprocessar score de todos os leads
CREATE OR REPLACE FUNCTION public.reprocessar_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF public.get_user_role() NOT IN ('gestor','admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas gestor/admin';
  END IF;
  UPDATE public.leads SET updated_at = now();  -- dispara trigger
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reprocessar_scores() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.reprocessar_scores() TO authenticated;
