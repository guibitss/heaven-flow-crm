-- RPCs de telemetria para o dashboard/vendedores (instrumentos só montam com
-- dado real — princípio "telemetria, não decoração").

-- Série diária de captação (sparklines / MiniSpark)
create or replace function public.get_serie_captacao(dias int default 14)
returns table(dia date, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select d::date as dia, count(l.id) as total
  from generate_series(current_date - (dias - 1), current_date, interval '1 day') d
  left join leads l on l.criado_em::date = d::date
  group by 1
  order by 1;
$$;

revoke all on function public.get_serie_captacao(int) from anon, public;
grant execute on function public.get_serie_captacao(int) to authenticated;

-- KPIs agregados de um vendedor (perfil /vendedores/:id)
create or replace function public.get_kpis_vendedor(_vendedor uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'total_leads',        (select count(*) from leads where vendedor_id = _vendedor),
    'leads_ativos',       (select count(*) from leads where vendedor_id = _vendedor
                             and status in ('qualificado','negociacao')),
    'ganhos_mes',         (select count(*) from leads where vendedor_id = _vendedor
                             and status = 'ganho'
                             and updated_at >= date_trunc('month', now())),
    'valor_pipeline',     (select coalesce(sum(valor_estimado), 0) from leads
                             where vendedor_id = _vendedor
                             and status in ('qualificado','negociacao')),
    'tempo_medio_resposta_segundos',
                          (select round(avg(tempo_primeira_resposta_segundos))
                             from leads where vendedor_id = _vendedor
                             and tempo_primeira_resposta_segundos is not null)
  );
$$;

revoke all on function public.get_kpis_vendedor(uuid) from anon, public;
grant execute on function public.get_kpis_vendedor(uuid) to authenticated;
