// qualify_lead — pontua leads `bruto` (0-100), define `temperatura` e promove
// para `qualificado` (>= min_score) ou `perdido` (abaixo). Escreve no CRM real
// (tabela leads) e registra no feed (eventos_feed, tipo status_change).
//
// Fórmula (ver README / teoria de captação):
//   +40 nome solar   +15 CNAE-alvo   +10 contato alcançável
//   +5 presença digital (site)   +5 região-alvo
//   -20 eletricista genérico (CNAE 4321-5/00) sem termo solar
//
// POST body opcional: { "limit": 200, "min_score": 60 }

import { getServiceClient, logEvento } from "../_shared/supabase.ts";
import { jsonResponse, corsHeaders } from "../_shared/cors.ts";
import { looksSolar } from "../_shared/solar.ts";
import type { LeadTemperatura } from "../_shared/types.ts";

const onlyDigits = (s: string) => (s ?? "").replace(/\D/g, "");
const CNAE_ELETRICISTA = "4321500"; // Instalação elétrica genérica (falso-positivo)

const DEFAULT_CNAES = [
  "4321500",
  "3511501",
  "4221904",
  "7112000",
  "4754702",
];

interface LeadRow {
  id: string;
  razao_social: string;
  cnpj: string | null;
  cnae: string | null;
  endereco_uf: string | null;
  telefone: string | null;
  decisor_email: string | null;
  decisor_telefone: string | null;
  site: string | null;
}

function temperaturaDe(score: number): LeadTemperatura {
  if (score >= 75) return "quente";
  if (score >= 50) return "morno";
  return "frio";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getServiceClient();
  const body = await req.json().catch(() => ({}));
  const limit = Number(body.limit ?? 200);

  // Config: CNAEs-alvo e UFs vêm de configuracoes_captacao.receita_config.
  const { data: cfgRow } = await supabase
    .from("configuracoes_captacao")
    .select("receita_config")
    .eq("id", 1)
    .maybeSingle();
  const receitaCfg = (cfgRow?.receita_config ?? {}) as {
    cnaes?: string[];
    ufs?: string[];
    min_score?: number;
  };
  const activeCnaes = new Set(
    (receitaCfg.cnaes?.length ? receitaCfg.cnaes : DEFAULT_CNAES).map(onlyDigits),
  );
  const ufSet = new Set((receitaCfg.ufs ?? []).map((u) => u.toUpperCase()));
  const minScore = Number(body.min_score ?? receitaCfg.min_score ?? 60);

  // Leads ainda não qualificados.
  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      "id,razao_social,cnpj,cnae,endereco_uf,telefone,decisor_email,decisor_telefone,site",
    )
    .eq("status", "bruto")
    .limit(limit);

  if (error) return jsonResponse({ error: error.message }, 500);

  const rows = (leads ?? []) as LeadRow[];
  if (rows.length === 0) return jsonResponse({ processados: 0 });

  let qualificados = 0;
  let perdidos = 0;

  for (const lead of rows) {
    const notes: string[] = [];
    let score = 0;

    const nameSolar = looksSolar(lead.razao_social ?? "");
    if (nameSolar) {
      score += 40;
      notes.push("+40 nome solar");
    }

    const cnaeDigits = onlyDigits(lead.cnae ?? "");
    if (activeCnaes.has(cnaeDigits)) {
      score += 15;
      notes.push("+15 CNAE-alvo");
    }

    const hasReachable = !!lead.telefone || !!lead.decisor_telefone ||
      !!lead.decisor_email;
    if (hasReachable) {
      score += 10;
      notes.push("+10 contato alcançável");
    }

    if (lead.site) {
      score += 5;
      notes.push("+5 presença digital");
    }

    const regionOk = ufSet.size === 0 ||
      (lead.endereco_uf && ufSet.has(lead.endereco_uf.toUpperCase()));
    if (regionOk) {
      score += 5;
      notes.push("+5 região-alvo");
    }

    if (!nameSolar && cnaeDigits === CNAE_ELETRICISTA) {
      score -= 20;
      notes.push("-20 eletricista genérico sem termo solar");
    }

    score = Math.max(0, Math.min(100, score));
    const temperatura = temperaturaDe(score);
    const status = score >= minScore ? "qualificado" : "perdido";
    if (status === "qualificado") qualificados++;
    else perdidos++;

    // Não sobrescrevemos metadata (preserva dados do import); as notas da
    // qualificação ficam registradas no eventos_feed abaixo.
    await supabase
      .from("leads")
      .update({ score, temperatura, status })
      .eq("id", lead.id);

    await logEvento(
      supabase,
      "status_change",
      status === "qualificado"
        ? `Qualificado (score ${score}, ${temperatura})`
        : `Descartado na qualificação (score ${score})`,
      { leadId: lead.id, metadata: { score, temperatura, status, notes } },
    );
  }

  return jsonResponse({ processados: rows.length, qualificados, perdidos });
});
