// discover_linkedin — descobre empresas via LinkedIn (scraping) e grava em
// public.leads (fonte=linkedin, fonte_ref=url da empresa, sem CNPJ).
//
// ⚠️ RISCO: scraping de LinkedIn viola o ToS e pode bloquear contas. O canal só
// roda se configuracoes_captacao.linkedin_config.habilitado_risco === true
// (opt-in explícito de risco) E linkedin_ativo === true.
//
// POST body: { queries?: string[], limit?: number }

import { getServiceClient, logEvento } from "../_shared/supabase.ts";
import { jsonResponse, corsHeaders } from "../_shared/cors.ts";
import { upsertDiscoveredLeads } from "../_shared/leads.ts";
import { getLinkedInProvider, type LinkedInCompany } from "../_shared/linkedin.ts";
import { looksSolar } from "../_shared/solar.ts";
import type { DiscoveredLead } from "../_shared/types.ts";

function companyToLead(c: LinkedInCompany): DiscoveredLead {
  return {
    razao_social: c.name,
    fonte: "linkedin",
    fonte_ref: c.ref,
    cnpj: null,
    site: c.website ?? null,
    metadata: {
      industry: c.industry ?? null,
      size: c.size ?? null,
      location: c.location ?? null,
      description: c.description ?? null,
      linkedin_url: c.ref,
      origem: "discover_linkedin",
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getServiceClient();
  const body = await req.json().catch(() => ({}));
  const limit = Number(body.limit ?? 50);

  const { data: cfgRow } = await supabase
    .from("configuracoes_captacao")
    .select("linkedin_ativo, linkedin_config")
    .eq("id", 1)
    .maybeSingle();
  const ativo = cfgRow?.linkedin_ativo === true;
  const liCfg = (cfgRow?.linkedin_config ?? {}) as {
    habilitado_risco?: boolean;
    queries?: string[];
  };

  // Dupla trava: canal ligado E risco explicitamente aceito.
  if (!ativo || liCfg.habilitado_risco !== true) {
    return jsonResponse({
      error:
        "Canal LinkedIn desligado ou risco não aceito. Ative linkedin_ativo e " +
        "marque linkedin_config.habilitado_risco=true (scraping viola o ToS do " +
        "LinkedIn e pode bloquear a conta).",
    }, 403);
  }

  let provider;
  try {
    provider = getLinkedInProvider();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: `Provedor LinkedIn: ${msg}` }, 400);
  }

  const queries: string[] = body.queries ?? liCfg.queries ??
    ["energia solar", "integradora solar", "energia fotovoltaica"];

  try {
    const empresas = await provider.searchCompanies(queries, limit);
    const leads = empresas
      .filter((c) => looksSolar(`${c.name} ${c.industry ?? ""} ${c.description ?? ""}`))
      .map(companyToLead);
    const r = await upsertDiscoveredLeads(supabase, leads);
    await logEvento(
      supabase,
      "captacao",
      `LinkedIn: ${r.inseridos} novas empresas (${empresas.length} achadas)`,
      { metadata: { encontrados: empresas.length, inseridos: r.inseridos, queries } },
    );
    return jsonResponse({ encontrados: empresas.length, inseridos: r.inseridos });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvento(supabase, "alerta", `Erro na captação LinkedIn: ${msg}`);
    return jsonResponse({ error: msg }, 502);
  }
});
