#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net --env-file=.env.local
// Seed de DEMONSTRAÇÃO — popula o funil com leads fictícios para visualizar o CRM.
// Tudo marcado com metadata.origem='seed_demo'. Idempotente (aborta se já existir).
//
// Limpar depois:  delete from leads where metadata->>'origem' = 'seed_demo';
//
// Rodar:  deno run --allow-read --allow-env --allow-net --env-file=.env.local scripts/seed_demo.ts
//
// SEGURANÇA: telefones são FICTÍCIOS (faixa 5544 9000X-XXXX). Nenhum número real.

import { createClient } from "jsr:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  Deno.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const NOMES = [
  "Helios Energia Solar", "Vale do Sol Integradora", "SolarTech Fotovoltaica",
  "Raio Verde Energia", "Sol Pleno Engenharia", "Fóton Energia Renovável",
  "Aurora Solar do Brasil", "Equinócio Energia", "Luz do Campo Solar",
  "Apolo Sistemas Solares", "Nova Era Fotovoltaica", "Solaris Integradora",
  "Brilho Solar Engenharia", "Energia Pura Fotovoltaica", "Sol Nascente Energia",
  "Terra Quente Solar", "Painel Vivo Energia", "Claridade Solar",
  "Vértice Energia Solar", "Sol & Cia Integradora", "Fênix Solar Energia",
  "Onda Solar do Sul", "Pampa Fotovoltaica", "Cerrado Solar Engenharia",
  "Litoral Energia Solar", "Serra Solar Integradora", "Alvorada Fotovoltaica",
  "Sol Forte Energia", "Insolação Energia Renovável", "Heliópolis Solar",
  "Prisma Energia Solar", "Boreal Fotovoltaica", "Sol Maior Engenharia",
  "Caminho do Sol Energia", "Radiante Integradora", "Energia do Amanhã Solar",
  "Sol Tropical Fotovoltaica", "Zênite Energia Solar", "Girassol Energia",
  "Sol de Minas Integradora", "Astro Solar Engenharia", "Verão Energia Solar",
  "Solário Fotovoltaica", "Luz Maior Energia", "Sol Brasil Integradora",
];
const CNAES = ["43.21-5/00", "35.11-5/01", "71.12-0/00", "47.42-3/00", "43.22-3/01"];
const UFS = ["PR", "SP", "MG", "RS", "SC", "BA", "GO", "CE"];
const STATUS_PLANO: [string, number][] = [
  ["bruto", 14], ["abordado", 8], ["respondeu", 7],
  ["qualificado", 8], ["negociacao", 5], ["ganho", 2], ["perdido", 1],
];
const FONTES = ["receita_federal", "google_maps", "manual", "indicacao"];

async function main() {
  const { count } = await sb.from("leads").select("id", { count: "exact", head: true })
    .eq("metadata->>origem", "seed_demo");
  if ((count ?? 0) > 0) {
    console.error(`Já existem ${count} leads de seed_demo. Abortando (idempotente).`);
    console.error("Para refazer: delete from leads where metadata->>'origem'='seed_demo';");
    Deno.exit(1);
  }

  const { data: profiles } = await sb.from("profiles").select("id, nome").limit(10);
  const vendedores = profiles ?? [];

  const linhas: Record<string, unknown>[] = [];
  let n = 0;
  for (const [status, qtd] of STATUS_PLANO) {
    for (let i = 0; i < qtd; i++) {
      const nome = NOMES[n % NOMES.length];
      const fonte = FONTES[n % FONTES.length];
      const temSite = n % 5 !== 0;
      const temDecisor = n % 3 === 0;
      const tel = `5544900${String(10000 + n).slice(-5)}`; // fictício
      linhas.push({
        razao_social: nome,
        cnpj: fonte === "receita_federal"
          ? String(10000000000000 + n * 7).slice(0, 14)
          : null,
        fonte,
        fonte_ref: fonte === "google_maps" ? `seed-gm-${n}` : null,
        cnae: CNAES[n % CNAES.length],
        endereco_uf: UFS[n % UFS.length],
        endereco_cidade: ["Maringá", "São Paulo", "Belo Horizonte", "Porto Alegre"][n % 4],
        capital_social: [50000, 180000, 450000, 1200000, 3500000, 8000000][n % 6],
        telefone: tel,
        site: temSite ? `https://${nome.toLowerCase().replace(/[^a-z]/g, "")}.com.br` : null,
        decisor_nome: temDecisor ? ["Carlos Souza", "Ana Lima", "Pedro Alves"][n % 3] : null,
        decisor_email: temDecisor ? `contato${n}@exemplo.com.br` : null,
        valor_estimado: 8000 + (n % 12) * 9500,
        status,
        metadata: { origem: "seed_demo" },
      });
      n++;
    }
  }

  const { data: inseridos, error } = await sb.from("leads").insert(linhas).select("id, status");
  if (error) {
    console.error("Erro inserindo leads:", error.message);
    Deno.exit(1);
  }
  console.log(`✓ ${inseridos?.length} leads inseridos (score/temperatura via trigger).`);

  // Atribui vendedor + handoff a leads adiantados; cria mensagens p/ alguns.
  if (vendedores.length) {
    const avancados = (inseridos ?? []).filter((l) =>
      ["qualificado", "negociacao", "ganho"].includes(l.status)
    );
    let m = 0;
    for (const lead of avancados) {
      const vend = vendedores[m % vendedores.length];
      const handoffMs = Date.now() - (1 + m * 6) * 3600_000; // 1h..vários dias
      await sb.from("leads").update({
        vendedor_id: vend.id,
        handoff_em: new Date(handoffMs).toISOString(),
      }).eq("id", lead.id);

      if (m < 8) {
        const aberturaMs = handoffMs + 60_000;
        const respLeadMs = aberturaMs + (3 + m) * 60_000;
        const respVendMs = respLeadMs + (2 + m * 30) * 60_000; // tempo variado
        await sb.from("mensagens").insert([
          { lead_id: lead.id, autor: "ia", conteudo: "Olá! Vi que vocês atuam com energia solar — temos estruturas de fixação que podem reduzir seu custo de instalação. Posso te mandar um material?", tipo: "texto", enviada_em: new Date(aberturaMs).toISOString() },
          { lead_id: lead.id, autor: "lead", conteudo: "Pode mandar sim, qual o prazo de entrega de vocês?", tipo: "texto", enviada_em: new Date(respLeadMs).toISOString() },
          { lead_id: lead.id, autor: "vendedor", autor_id: vend.id, conteudo: "Oi! Entrega em 7 dias úteis para a sua região. Vou te passar a tabela.", tipo: "texto", enviada_em: new Date(respVendMs).toISOString() },
        ]);
      }
      m++;
    }
    console.log(`✓ ${avancados.length} leads atribuídos a vendedores; ${Math.min(8, avancados.length)} com conversa.`);
  }

  // Eventos de feed.
  const eventos = (inseridos ?? []).slice(0, 10).map((l, i) => ({
    tipo: i % 3 === 0 ? "captacao" : i % 3 === 1 ? "resposta_lead" : "handoff",
    texto: i % 3 === 0
      ? "Novo lead captado pela Receita Federal"
      : i % 3 === 1
      ? "Lead respondeu a mensagem de abertura"
      : "Lead transferido para a fila de vendedores",
    lead_id: l.id,
    metadata: { origem: "seed_demo" },
  }));
  await sb.from("eventos_feed").insert(eventos);
  console.log(`✓ ${eventos.length} eventos de feed.`);

  console.log("\nResumo por status:");
  for (const [status, qtd] of STATUS_PLANO) console.log(`  ${status}: ${qtd}`);
  console.log("\nLimpar: delete from leads where metadata->>'origem'='seed_demo';");
}

await main();
