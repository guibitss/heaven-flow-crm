// discover_instagram — descobre/enriquece leads via Instagram e grava em
// public.leads (fonte=instagram, fonte_ref=@handle, sem CNPJ → dedup por handle).
//
// Provedor escolhido por env INSTAGRAM_PROVIDER ('graph' grátis só enriquece |
// 'apify' pago descobre por hashtag). Config em configuracoes_captacao.instagram_config.
//
// POST body: { mode: 'discover'|'enrich', hashtags?: string[], handles?: string[], limit?: number }

import { getServiceClient, logEvento } from "../_shared/supabase.ts";
import { jsonResponse, corsHeaders } from "../_shared/cors.ts";
import { upsertDiscoveredLeads } from "../_shared/leads.ts";
import {
  getInstagramProvider,
  type InstagramProfile,
} from "../_shared/instagram.ts";
import { looksSolar } from "../_shared/solar.ts";
import type { DiscoveredLead } from "../_shared/types.ts";

function profileToLead(p: InstagramProfile): DiscoveredLead {
  return {
    razao_social: p.full_name || `@${p.handle}`,
    fonte: "instagram",
    fonte_ref: p.handle,
    cnpj: null,
    site: p.website ?? null,
    decisor_email: p.email ?? null,
    telefone: p.phone ?? null,
    metadata: {
      handle: p.handle,
      followers: p.followers ?? null,
      category: p.category ?? null,
      is_business: p.is_business ?? null,
      biography: p.biography ?? null,
      origem: "discover_instagram",
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getServiceClient();
  const body = await req.json().catch(() => ({}));
  const mode: string = body.mode ?? "discover";
  const limit = Number(body.limit ?? 50);

  const { data: cfgRow } = await supabase
    .from("configuracoes_captacao")
    .select("instagram_config")
    .eq("id", 1)
    .maybeSingle();
  const igCfg = (cfgRow?.instagram_config ?? {}) as {
    hashtags?: string[];
    handles?: string[];
  };

  let provider;
  try {
    provider = getInstagramProvider();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: `Provedor Instagram: ${msg}` }, 400);
  }

  try {
    if (mode === "discover") {
      if (!provider.canDiscover) {
        return jsonResponse({
          error:
            "O provedor atual (Graph API) não descobre perfis novos. " +
            "Use INSTAGRAM_PROVIDER=apify para descoberta por hashtag.",
        }, 400);
      }
      const hashtags: string[] = body.hashtags ?? igCfg.hashtags ?? [];
      if (hashtags.length === 0) {
        return jsonResponse({
          error: "Sem hashtags. Configure instagram_config.hashtags ou passe { hashtags: [...] }.",
        }, 400);
      }
      const perfis = await provider.discoverByHashtag(hashtags, limit);
      // Gate solar: nome ou bio precisa indicar o setor (evita lixo da hashtag).
      const leads = perfis
        .filter((p) => looksSolar(`${p.full_name ?? ""} ${p.biography ?? ""}`))
        .map(profileToLead);
      const r = await upsertDiscoveredLeads(supabase, leads);
      await logEvento(
        supabase,
        "captacao",
        `Instagram: ${r.inseridos} novos perfis (${perfis.length} achados em ${hashtags.length} hashtag(s))`,
        { metadata: { encontrados: perfis.length, inseridos: r.inseridos, hashtags } },
      );
      return jsonResponse({ mode, encontrados: perfis.length, inseridos: r.inseridos });
    }

    // mode === 'enrich': completa leads que já têm @ conhecido.
    let handles: string[] = body.handles ?? igCfg.handles ?? [];
    if (handles.length === 0) {
      const { data: pend } = await supabase
        .from("leads")
        .select("fonte_ref")
        .eq("fonte", "instagram")
        .is("site", null)
        .limit(limit);
      handles = (pend ?? []).map((l) => l.fonte_ref).filter(Boolean) as string[];
    }
    let enriquecidos = 0;
    for (const h of handles.slice(0, limit)) {
      const p = await provider.enrichProfile(h);
      if (!p) continue;
      await supabase
        .from("leads")
        .update({
          razao_social: p.full_name || `@${p.handle}`,
          site: p.website ?? null,
          decisor_email: p.email ?? null,
          telefone: p.phone ?? null,
        })
        .eq("fonte", "instagram")
        .eq("fonte_ref", p.handle);
      enriquecidos++;
    }
    await logEvento(supabase, "captacao", `Instagram: ${enriquecidos} perfis enriquecidos`, {
      metadata: { enriquecidos },
    });
    return jsonResponse({ mode, enriquecidos });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvento(supabase, "alerta", `Erro na captação Instagram: ${msg}`);
    return jsonResponse({ error: msg }, 502);
  }
});
