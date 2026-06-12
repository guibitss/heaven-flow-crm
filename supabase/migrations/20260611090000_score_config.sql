-- Score configurável via painel + correções.
--
-- 1. configuracoes_captacao.score_config (jsonb): pesos da fórmula de score
--    editáveis pela UI. Vazio = comportamento idêntico ao hardcoded anterior.
--    Semântica: cada seção presente no jsonb passa a SER a verdade daquela
--    dimensão (cnae/uf usam chave "default" para o resto).
--    Formato:
--    {
--      "cnae":       {"35.11":30,"35.14":30,"43.21":25,"43.22":25,"71.12":20,
--                     "47.42":15,"46.73":15,"default":5},
--      "capital":    {"divisor":20000,"max":25},
--      "porte":      {"GRANDE":20,"MEDIA":15,"EPP":10,"ME":5},
--      "uf":         {"MG":15,"SP":15,"PR":13,"RS":12,"SC":12,"BA":11,"GO":10,
--                     "MT":10,"CE":9,"PE":9,"default":5},
--      "completude": {"telefone":4,"site":3,"decisor":3},
--      "temperatura":{"quente":81,"morno":50}
--    }
--
-- 2. calcular_score_lead: passa a ler score_config (IMMUTABLE -> STABLE; nenhum
--    índice depende dela). Sem config, usa exatamente os pesos originais.
--
-- 3. aplicar_score_temperatura: thresholds de temperatura configuráveis.
--
-- 4. BUGFIX reprocessar_scores(): fazia "SET updated_at = now()", mas o trigger
--    trg_score_leads é "UPDATE OF cnae, capital_social, ..." — updated_at não
--    está na lista, então NADA era reprocessado. Agora usa "SET cnae = cnae"
--    (no-op que consta da lista e dispara o trigger).
--
-- 5. RPC get_leads_por_uf: agregado para o mapa do dashboard.

alter table public.configuracoes_captacao
  add column if not exists score_config jsonb not null default '{}'::jsonb;

create or replace function public.calcular_score_lead(_lead public.leads)
returns integer
language plpgsql
stable
set search_path = public
as $$
declare
  cfg jsonb := '{}'::jsonb;
  v_score numeric := 0;
  v_prefix text;
begin
  select coalesce(score_config, '{}'::jsonb) into cfg
    from configuracoes_captacao where id = 1;
  cfg := coalesce(cfg, '{}'::jsonb);

  -- CNAE (prefixo "DD.DD" dos 5 primeiros chars; ex.: "43.21-5/00" -> "43.21")
  v_prefix := substring(coalesce(_lead.cnae, '') from 1 for 5);
  if cfg ? 'cnae' then
    v_score := v_score + coalesce(
      (cfg->'cnae'->>v_prefix)::numeric,
      (cfg->'cnae'->>'default')::numeric, 5);
  else
    v_score := v_score + case
      when v_prefix in ('35.11','35.14') then 30
      when v_prefix in ('43.21','43.22') then 25
      when v_prefix = '71.12' then 20
      when v_prefix in ('47.42','46.73') then 15
      else 5 end;
  end if;

  -- Capital social
  v_score := v_score + least(
    coalesce((cfg->'capital'->>'max')::numeric, 25),
    coalesce(_lead.capital_social, 0)
      / greatest(coalesce((cfg->'capital'->>'divisor')::numeric, 20000), 1));

  -- Porte
  if cfg ? 'porte' then
    v_score := v_score + coalesce((cfg->'porte'->>(_lead.porte::text))::numeric, 0);
  else
    v_score := v_score + case _lead.porte
      when 'GRANDE' then 20 when 'MEDIA' then 15
      when 'EPP' then 10 when 'ME' then 5 else 0 end;
  end if;

  -- Região (UF)
  if cfg ? 'uf' then
    v_score := v_score + coalesce(
      (cfg->'uf'->>coalesce(_lead.endereco_uf, ''))::numeric,
      (cfg->'uf'->>'default')::numeric, 5);
  else
    v_score := v_score + case coalesce(_lead.endereco_uf, '')
      when 'MG' then 15 when 'SP' then 15 when 'PR' then 13 when 'RS' then 12
      when 'SC' then 12 when 'BA' then 11 when 'GO' then 10 when 'MT' then 10
      when 'CE' then 9 when 'PE' then 9 else 5 end;
  end if;

  -- Completude do cadastro
  if _lead.telefone is not null and length(_lead.telefone) > 8 then
    v_score := v_score + coalesce((cfg->'completude'->>'telefone')::numeric, 4);
  end if;
  if _lead.site is not null then
    v_score := v_score + coalesce((cfg->'completude'->>'site')::numeric, 3);
  end if;
  if _lead.decisor_nome is not null then
    v_score := v_score + coalesce((cfg->'completude'->>'decisor')::numeric, 3);
  end if;

  return greatest(0, least(100, round(v_score)::int));
end;
$$;

revoke execute on function public.calcular_score_lead(public.leads) from anon, public;
grant execute on function public.calcular_score_lead(public.leads) to authenticated;

create or replace function public.aplicar_score_temperatura()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score int;
  cfg jsonb := '{}'::jsonb;
  t_quente int;
  t_morno int;
begin
  select coalesce(score_config, '{}'::jsonb) into cfg
    from configuracoes_captacao where id = 1;
  cfg := coalesce(cfg, '{}'::jsonb);
  t_quente := coalesce((cfg->'temperatura'->>'quente')::int, 81);
  t_morno  := coalesce((cfg->'temperatura'->>'morno')::int, 50);

  if new.porte is null then
    new.porte := case
      when coalesce(new.capital_social, 0) >= 4800000 then 'GRANDE'::lead_porte
      when coalesce(new.capital_social, 0) >= 360000  then 'MEDIA'::lead_porte
      when coalesce(new.capital_social, 0) >= 81000   then 'EPP'::lead_porte
      else 'ME'::lead_porte end;
  end if;

  v_score := public.calcular_score_lead(new);
  new.score := v_score;
  new.temperatura := case
    when v_score >= t_quente then 'quente'::lead_temperatura
    when v_score >= t_morno  then 'morno'::lead_temperatura
    else 'frio'::lead_temperatura end;
  return new;
end;
$$;

create or replace function public.reprocessar_scores()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count int;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if public.get_user_role() not in ('gestor','admin') then
    raise exception 'Acesso negado: apenas gestor/admin';
  end if;
  -- "set cnae = cnae" é no-op de valor, mas consta da lista UPDATE OF do
  -- trigger trg_score_leads (updated_at NÃO consta — era o bug).
  update public.leads set cnae = cnae;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Agregado por UF para o mapa do dashboard (aggregate-only; sem dados de lead).
create or replace function public.get_leads_por_uf(periodo_dias int default 36500)
returns table(uf text, total bigint, quentes bigint, qualificados bigint, score_medio numeric)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(endereco_uf, '??') as uf,
         count(*) as total,
         count(*) filter (where temperatura = 'quente') as quentes,
         count(*) filter (where status in ('qualificado','negociacao','ganho')) as qualificados,
         round(avg(score), 1) as score_medio
  from leads
  where criado_em >= now() - make_interval(days => periodo_dias)
  group by 1
  order by 2 desc;
$$;

revoke all on function public.get_leads_por_uf(int) from anon, public;
grant execute on function public.get_leads_por_uf(int) to authenticated;
