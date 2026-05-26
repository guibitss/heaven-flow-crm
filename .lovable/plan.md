## Heaven CRM — Fase 2: Integração Supabase + Tempo de Resposta

Esta é uma fase grande (schema completo + RLS + triggers + RPCs + auth + 8 hooks + nova feature de UI em 5 lugares). Vou executar em etapas claras.

### Etapa 1 — Schema do banco (migration única)

Criar todos os enums, tabelas, indexes, RLS policies, triggers e RPCs em uma única migration:

- **Enums**: `lead_status`, `lead_fonte`, `lead_temperatura`, `lead_porte`, `user_role`, `user_status`, `mensagem_autor`, `mensagem_tipo`, `evento_tipo`
- **Tabelas**: `profiles`, `leads`, `mensagens`, `tags`, `lead_tags`, `notas`, `anexos`, `eventos_feed`, `configuracoes_ia`, `configuracoes_captacao`, `blacklist`, `relatorios`
- **Helper**: `get_user_role()` SECURITY DEFINER
- **RLS** habilitado em todas + policies conforme spec (vendedor vê só seus leads + pool; gestor/admin vê tudo)
- **Triggers**:
  1. `handle_new_user` — cria profile ao criar auth.users
  2. `calcular_primeira_resposta_vendedor` — calcula tempo após handoff
  3. `registrar_handoff` — marca `handoff_em` ao mover pra qualificado
  4. `on_lead_captado` — evento de feed na captação
- **RPCs**: `get_dashboard_kpis`, `get_ranking_velocidade_vendedores`, `get_leads_aguardando_resposta`, `get_funil_data`
- **Realtime**: publicar `leads`, `mensagens`, `eventos_feed`

### Etapa 2 — Seed data

Migration separada inserindo:
- 8 profiles (1 admin, 1 gestor, 6 vendedores) — `id` gerado, sem auth.users vinculado (serão criados na primeira sessão real)
- 60 leads do setor solar, distribuídos em todos status
- ~10 leads com `handoff_em` preenchido (com variação de tempos: 5s, 2min, 15min, 1h30, 4h, 8h, e ~3 sem resposta)
- Mensagens correspondentes (lead + vendedor) com `enviada_em` posterior pro trigger calcular
- Tags básicas + lead_tags
- Configurações default

Nota: profiles seedados terão UUID aleatório (não vinculados a auth.users). O trigger `handle_new_user` cuida de novos usuários reais. Para validar RLS na UI mock-auth-free, exibimos tudo como gestor por enquanto.

### Etapa 3 — Auth real

- `src/lib/auth-context.tsx` — `AuthProvider` com `user` + `profile` + listener `onAuthStateChange`
- Wrap em `__root.tsx`
- Atualizar `src/routes/login.tsx` para chamar `supabase.auth.signInWithPassword`
- Atualizar `_app.tsx` `beforeLoad` pra redirect ao login se não autenticado
- Página `/signup` simples (ou só ativar sign-up no painel; criar form opcional)

### Etapa 4 — Hooks Supabase

`src/hooks/`:
- `use-dashboard-kpis.ts`
- `use-leads.ts`
- `use-lead-detail.ts`
- `use-live-feed.ts` (realtime)
- `use-ranking-velocidade.ts`
- `use-leads-aguardando.ts`
- `use-vendedores.ts` (profiles where role=vendedor)
- `use-mutate-lead.ts` (updateStatus, assign, etc)
- `use-funil.ts`

Adicionar TanStack Query Provider em `__root.tsx`.

### Etapa 5 — Substituir mock por hooks nas páginas

- `dashboard.tsx` — KPIs via `useDashboardKpis`; FunnelCard via `useFunil`; LiveFeed via realtime; **adicionar 7º KPI "Tempo médio de resposta"** (grid vira 4 cols desktop); **nova seção "Velocidade de resposta"** entre LiveFeed e Mapa
- `crm.tsx` — leads via `useLeads`; mutation no drag; **indicador de tempo** nos cards Qualificado/Negociação
- `crm.$id.tsx` — `useLeadDetail`; timeline com evento "primeira resposta" destacado; contador vivo se aguardando
- `vendedores/index.tsx` — `useVendedores` (profiles)
- `vendedores/$id.tsx` — adicionar card "Velocidade de resposta" entre KPIs e gráfico
- `captacao.tsx`, `ia.tsx` — ler/salvar configuracoes_*

### Etapa 6 — Novos componentes da feature

- `src/lib/format-tempo.ts` — `formatarTempo()` + `corPorTempo()`
- `src/components/dashboard/tempo-resposta-kpi.tsx` — 7º KPI especial (cor dinâmica do ícone)
- `src/components/dashboard/ranking-velocidade.tsx` — barras horizontais recharts
- `src/components/dashboard/aguardando-resposta.tsx` — lista com contador vivo (re-render a cada 30s)
- `src/components/crm/tempo-indicador.tsx` — badge nos cards do kanban
- `src/components/vendedor/velocidade-card.tsx` — card no perfil

### Detalhes técnicos

- Stack: TanStack Router já presente; adicionar `@tanstack/react-query` + provider
- Tipos: Supabase types já existem em `src/integrations/supabase/types.ts` — após migration, serão regenerados automaticamente
- RLS: vendedor seedado não tem auth.users; pra demo, login real cria profile via trigger e o usuário vê leads do pool (vendedor_id IS NULL). Posso assinar alguns leads seed ao usuário recém-criado via UI ou deixar como gestor por padrão (`raw_user_meta_data.role = 'gestor'` no signup demo)
- Realtime: subscribe via `supabase.channel().on('postgres_changes')`
- Contadores vivos: `useEffect` com `setInterval(1000)` no componente "aguardando resposta" pra recomputar segundos sem refetch

### Itens fora do escopo (conforme spec)

❌ Edge Functions, WAHA, Bling real, PDF real, storage real, push/email

---

**Confirma para eu executar?** Vou começar pelos migrations (schema + seed), depois auth + hooks + UI.
