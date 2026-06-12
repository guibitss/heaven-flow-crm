-- Captação completa: habilita Instagram e LinkedIn como fontes de lead.
--
-- O enum lead_fonte só tinha google_maps/receita_federal/indicacao/manual.
-- Adicionamos instagram e linkedin, e a config por-canal em configuracoes_captacao
-- (espelhando receita_config/google_maps_config).
--
-- Obs.: ALTER TYPE ... ADD VALUE roda fora de transação e os valores novos só
-- ficam utilizáveis após o commit — por isso enum e colunas vão em passos
-- separados na aplicação via API.

alter type public.lead_fonte add value if not exists 'instagram';
alter type public.lead_fonte add value if not exists 'linkedin';

-- Config por canal (flags + jsonb), espelhando receita/google_maps.
--   instagram_config: { provider:'graph'|'apify', hashtags:string[], handles:string[] }
--   linkedin_config:  { habilitado_risco:boolean, provider:string, queries:string[] }
alter table public.configuracoes_captacao
  add column if not exists instagram_ativo boolean not null default false,
  add column if not exists instagram_config jsonb not null default '{}'::jsonb,
  add column if not exists linkedin_ativo boolean not null default false,
  add column if not exists linkedin_config jsonb not null default '{}'::jsonb;
