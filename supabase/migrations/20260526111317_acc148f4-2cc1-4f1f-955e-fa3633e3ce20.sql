
-- ============= ENUMS =============
CREATE TYPE lead_status AS ENUM ('bruto', 'abordado', 'respondeu', 'qualificado', 'negociacao', 'ganho', 'perdido');
CREATE TYPE lead_fonte AS ENUM ('google_maps', 'receita_federal', 'indicacao', 'manual');
CREATE TYPE lead_temperatura AS ENUM ('quente', 'morno', 'frio');
CREATE TYPE lead_porte AS ENUM ('ME', 'EPP', 'MEDIA', 'GRANDE');
CREATE TYPE user_role AS ENUM ('vendedor', 'gestor', 'admin');
CREATE TYPE user_status AS ENUM ('ativo', 'pausado');
CREATE TYPE mensagem_autor AS ENUM ('ia', 'lead', 'vendedor');
CREATE TYPE mensagem_tipo AS ENUM ('texto', 'imagem', 'arquivo');
CREATE TYPE evento_tipo AS ENUM ('captacao', 'mensagem_ia', 'resposta_lead', 'handoff', 'primeira_resposta_vendedor', 'venda', 'alerta', 'status_change');

-- ============= TABLES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  avatar_url TEXT,
  cargo TEXT,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  regiao TEXT,
  role user_role NOT NULL DEFAULT 'vendedor',
  status user_status NOT NULL DEFAULT 'ativo',
  limite_leads_abertos INT DEFAULT 50,
  meta_mensal NUMERIC(10,2),
  ticket_medio NUMERIC(10,2) DEFAULT 0,
  fechamentos_mes NUMERIC(12,2) DEFAULT 0,
  taxa_conversao NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  cnae TEXT,
  cnae_descricao TEXT,
  endereco_logradouro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  telefone TEXT,
  site TEXT,
  decisor_nome TEXT,
  decisor_cargo TEXT,
  decisor_telefone TEXT,
  decisor_email TEXT,
  porte lead_porte,
  capital_social NUMERIC(15,2),
  status lead_status NOT NULL DEFAULT 'bruto',
  score INT CHECK (score >= 0 AND score <= 100) DEFAULT 50,
  fonte lead_fonte NOT NULL,
  temperatura lead_temperatura DEFAULT 'morno',
  vendedor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  valor_estimado NUMERIC(12,2),
  bling_cliente_id TEXT,
  handoff_em TIMESTAMPTZ,
  primeira_resposta_vendedor_em TIMESTAMPTZ,
  tempo_primeira_resposta_segundos INT,
  ultimo_contato TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_vendedor ON public.leads(vendedor_id);
CREATE INDEX idx_leads_fonte ON public.leads(fonte);
CREATE INDEX idx_leads_score ON public.leads(score DESC);
CREATE INDEX idx_leads_handoff_pending ON public.leads(handoff_em) WHERE primeira_resposta_vendedor_em IS NULL;
CREATE INDEX idx_leads_cnpj ON public.leads(cnpj);
CREATE INDEX idx_leads_criado_em ON public.leads(criado_em DESC);

CREATE TABLE public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  autor mensagem_autor NOT NULL,
  autor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conteudo TEXT NOT NULL,
  tipo mensagem_tipo DEFAULT 'texto',
  arquivo_url TEXT,
  enviada_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_mensagens_lead ON public.mensagens(lead_id, enviada_em);
CREATE INDEX idx_mensagens_autor ON public.mensagens(autor_id) WHERE autor = 'vendedor';

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  cor TEXT DEFAULT '#F27F1B',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.lead_tags (
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, tag_id)
);

CREATE TABLE public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notas_lead ON public.notas(lead_id, created_at DESC);

CREATE TABLE public.anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT,
  tamanho_bytes BIGINT,
  upload_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.eventos_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo evento_tipo NOT NULL,
  texto TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  vendedor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_eventos_created ON public.eventos_feed(created_at DESC);
CREATE INDEX idx_eventos_lead ON public.eventos_feed(lead_id);

CREATE TABLE public.configuracoes_ia (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mensagem_abertura TEXT,
  variante_b TEXT,
  perguntas_qualificacao JSONB DEFAULT '[]',
  regras_handoff JSONB DEFAULT '{}',
  horario_inicio TIME DEFAULT '08:00',
  horario_fim TIME DEFAULT '18:00',
  dias_semana TEXT[] DEFAULT ARRAY['seg','ter','qua','qui','sex'],
  reativacao JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.configuracoes_captacao (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  captacao_ativa BOOLEAN DEFAULT true,
  google_maps_ativo BOOLEAN DEFAULT false,
  google_maps_config JSONB DEFAULT '{}',
  receita_ativo BOOLEAN DEFAULT false,
  receita_config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.configuracoes_ia (id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO public.configuracoes_captacao (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE NOT NULL,
  razao_social TEXT,
  motivo TEXT,
  adicionado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  url_pdf TEXT,
  tamanho_bytes BIGINT,
  gerado_em TIMESTAMPTZ DEFAULT now()
);

-- ============= RLS =============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_captacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid(); $$;

-- profiles
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- leads
CREATE POLICY "leads_read" ON public.leads FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('gestor','admin') OR vendedor_id = auth.uid() OR vendedor_id IS NULL);
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('gestor','admin') OR vendedor_id = auth.uid());
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('gestor','admin'));
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- mensagens
CREATE POLICY "mensagens_read" ON public.mensagens FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('gestor','admin') OR EXISTS (
    SELECT 1 FROM public.leads WHERE leads.id = mensagens.lead_id
    AND (leads.vendedor_id = auth.uid() OR leads.vendedor_id IS NULL)
  ));
CREATE POLICY "mensagens_insert" ON public.mensagens FOR INSERT TO authenticated
  WITH CHECK ((autor = 'vendedor' AND autor_id = auth.uid()) OR public.get_user_role() IN ('gestor','admin'));

-- tags
CREATE POLICY "tags_read" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "tags_write" ON public.tags FOR ALL TO authenticated USING (public.get_user_role() IN ('gestor','admin')) WITH CHECK (public.get_user_role() IN ('gestor','admin'));

-- lead_tags
CREATE POLICY "lead_tags_read" ON public.lead_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "lead_tags_write" ON public.lead_tags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_tags.lead_id AND (public.get_user_role() IN ('gestor','admin') OR leads.vendedor_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_tags.lead_id AND (public.get_user_role() IN ('gestor','admin') OR leads.vendedor_id = auth.uid())));

-- notas
CREATE POLICY "notas_read" ON public.notas FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('gestor','admin') OR EXISTS (
    SELECT 1 FROM public.leads WHERE leads.id = notas.lead_id AND (leads.vendedor_id = auth.uid() OR leads.vendedor_id IS NULL)
  ));
CREATE POLICY "notas_insert" ON public.notas FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid());

-- anexos
CREATE POLICY "anexos_read" ON public.anexos FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('gestor','admin') OR EXISTS (
    SELECT 1 FROM public.leads WHERE leads.id = anexos.lead_id AND (leads.vendedor_id = auth.uid() OR leads.vendedor_id IS NULL)
  ));
CREATE POLICY "anexos_insert" ON public.anexos FOR INSERT TO authenticated WITH CHECK (upload_por = auth.uid());

-- eventos_feed
CREATE POLICY "eventos_read" ON public.eventos_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY "eventos_write" ON public.eventos_feed FOR INSERT TO authenticated WITH CHECK (true);

-- configs
CREATE POLICY "cfg_ia_read" ON public.configuracoes_ia FOR SELECT TO authenticated USING (true);
CREATE POLICY "cfg_ia_write" ON public.configuracoes_ia FOR ALL TO authenticated USING (public.get_user_role() IN ('gestor','admin')) WITH CHECK (public.get_user_role() IN ('gestor','admin'));
CREATE POLICY "cfg_cap_read" ON public.configuracoes_captacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "cfg_cap_write" ON public.configuracoes_captacao FOR ALL TO authenticated USING (public.get_user_role() IN ('gestor','admin')) WITH CHECK (public.get_user_role() IN ('gestor','admin'));

-- blacklist
CREATE POLICY "blacklist_all" ON public.blacklist FOR ALL TO authenticated USING (public.get_user_role() IN ('gestor','admin')) WITH CHECK (public.get_user_role() IN ('gestor','admin'));

-- relatorios
CREATE POLICY "relatorios_read" ON public.relatorios FOR SELECT TO authenticated USING (true);
CREATE POLICY "relatorios_write" ON public.relatorios FOR ALL TO authenticated USING (public.get_user_role() IN ('gestor','admin')) WITH CHECK (public.get_user_role() IN ('gestor','admin'));

-- ============= TRIGGERS =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'gestor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.calcular_primeira_resposta_vendedor()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lead RECORD; v_tempo_segundos INT;
BEGIN
  UPDATE public.leads SET ultimo_contato = NEW.enviada_em WHERE id = NEW.lead_id;
  IF NEW.autor = 'vendedor' THEN
    SELECT * INTO v_lead FROM public.leads WHERE id = NEW.lead_id;
    IF v_lead.handoff_em IS NOT NULL AND v_lead.primeira_resposta_vendedor_em IS NULL THEN
      v_tempo_segundos := EXTRACT(EPOCH FROM (NEW.enviada_em - v_lead.handoff_em))::INT;
      UPDATE public.leads SET primeira_resposta_vendedor_em = NEW.enviada_em, tempo_primeira_resposta_segundos = v_tempo_segundos WHERE id = NEW.lead_id;
      INSERT INTO public.eventos_feed (tipo, texto, lead_id, vendedor_id, metadata)
      VALUES ('primeira_resposta_vendedor',
        format('**%s** respondeu **%s** em %s',
          COALESCE((SELECT nome FROM public.profiles WHERE id = NEW.autor_id), 'Vendedor'),
          v_lead.razao_social,
          CASE
            WHEN v_tempo_segundos < 60 THEN format('%ss', v_tempo_segundos)
            WHEN v_tempo_segundos < 3600 THEN format('%sm', v_tempo_segundos / 60)
            WHEN v_tempo_segundos < 86400 THEN format('%sh %sm', v_tempo_segundos / 3600, (v_tempo_segundos % 3600) / 60)
            ELSE format('%sd %sh', v_tempo_segundos / 86400, (v_tempo_segundos % 86400) / 3600)
          END),
        NEW.lead_id, NEW.autor_id,
        jsonb_build_object('tempo_segundos', v_tempo_segundos));
    END IF;
  END IF;
  IF NEW.autor = 'lead' THEN
    INSERT INTO public.eventos_feed (tipo, texto, lead_id)
    VALUES ('resposta_lead',
      format('**%s** respondeu', (SELECT razao_social FROM public.leads WHERE id = NEW.lead_id)),
      NEW.lead_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_mensagem_insert
  AFTER INSERT ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.calcular_primeira_resposta_vendedor();

CREATE OR REPLACE FUNCTION public.registrar_handoff()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'qualificado' AND OLD.status != 'qualificado' AND NEW.handoff_em IS NULL THEN
    NEW.handoff_em := now();
    INSERT INTO public.eventos_feed (tipo, texto, lead_id, vendedor_id)
    VALUES ('handoff',
      format('Lead **%s** transferido para **%s**', NEW.razao_social,
        COALESCE((SELECT nome FROM public.profiles WHERE id = NEW.vendedor_id), 'fila geral')),
      NEW.id, NEW.vendedor_id);
  END IF;
  IF NEW.status != OLD.status THEN
    INSERT INTO public.eventos_feed (tipo, texto, lead_id)
    VALUES ('status_change',
      format('**%s** mudou de status: %s → %s', NEW.razao_social, OLD.status, NEW.status),
      NEW.id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

CREATE TRIGGER on_lead_update
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.registrar_handoff();

CREATE OR REPLACE FUNCTION public.on_lead_captado()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.eventos_feed (tipo, texto, lead_id, metadata)
  VALUES ('captacao',
    format('**%s** captado via %s', NEW.razao_social, NEW.fonte),
    NEW.id, jsonb_build_object('fonte', NEW.fonte));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_lead_insert
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.on_lead_captado();

-- ============= RPCs =============
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(periodo_dias INT DEFAULT 30)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE resultado JSON;
  data_inicio TIMESTAMPTZ := now() - (periodo_dias || ' days')::INTERVAL;
  data_inicio_anterior TIMESTAMPTZ := now() - (periodo_dias * 2 || ' days')::INTERVAL;
BEGIN
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
END; $$;

CREATE OR REPLACE FUNCTION public.get_ranking_velocidade_vendedores(periodo_dias INT DEFAULT 30)
RETURNS TABLE (vendedor_id UUID, nome TEXT, avatar_url TEXT, tempo_medio_segundos INT, total_respostas INT, taxa_excelencia NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.nome, p.avatar_url,
    ROUND(AVG(l.tempo_primeira_resposta_segundos))::INT,
    COUNT(*)::INT,
    ROUND(100.0 * COUNT(*) FILTER (WHERE l.tempo_primeira_resposta_segundos <= 1800) / NULLIF(COUNT(*), 0), 1)
  FROM public.leads l JOIN public.profiles p ON p.id = l.vendedor_id
  WHERE l.tempo_primeira_resposta_segundos IS NOT NULL
    AND l.handoff_em >= now() - (periodo_dias || ' days')::INTERVAL
  GROUP BY p.id, p.nome, p.avatar_url
  ORDER BY AVG(l.tempo_primeira_resposta_segundos) ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_leads_aguardando_resposta()
RETURNS TABLE (lead_id UUID, razao_social TEXT, vendedor_id UUID, vendedor_nome TEXT, vendedor_avatar TEXT, handoff_em TIMESTAMPTZ, segundos_aguardando INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.razao_social, p.id, p.nome, p.avatar_url, l.handoff_em,
    EXTRACT(EPOCH FROM (now() - l.handoff_em))::INT
  FROM public.leads l LEFT JOIN public.profiles p ON p.id = l.vendedor_id
  WHERE l.handoff_em IS NOT NULL AND l.primeira_resposta_vendedor_em IS NULL
    AND l.status IN ('qualificado','negociacao')
  ORDER BY l.handoff_em ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_funil_data(periodo_dias INT DEFAULT 30)
RETURNS TABLE (status lead_status, total BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status, COUNT(*) FROM public.leads
  WHERE criado_em >= now() - (periodo_dias || ' days')::INTERVAL
  GROUP BY status
  ORDER BY array_position(ARRAY['bruto','abordado','respondeu','qualificado','negociacao','ganho','perdido']::lead_status[], status);
$$;

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos_feed;
