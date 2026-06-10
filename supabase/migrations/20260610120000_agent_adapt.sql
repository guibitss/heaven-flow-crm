-- Ajustes ADITIVOS na tabela leads para o agente de prospecção (descoberta
-- multicanal). Já aplicado no banco em 2026-06-09 via Management API; este arquivo
-- mantém o histórico de migrations versionado. Idempotente.
--
--   1. leads.cnpj aceita NULL — Google Maps/Instagram não trazem CNPJ.
--   2. leads.fonte_ref — id da origem (ex.: place_id) p/ dedup sem CNPJ.
--   3. leads.metadata — jsonb livre p/ sinais de captação.
--   4. Índice único parcial (fonte, fonte_ref) p/ deduplicar leads sem CNPJ.

alter table public.leads alter column cnpj drop not null;

alter table public.leads add column if not exists fonte_ref text;

alter table public.leads
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists leads_fonte_ref_unique
  on public.leads (fonte, fonte_ref)
  where fonte_ref is not null;
