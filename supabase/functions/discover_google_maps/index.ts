// discover_google_maps — descobre integradoras/instaladoras solares via Google
// Places API (Text Search v1) e grava em public.leads (fonte=google_maps,
// fonte_ref=place_id, sem CNPJ). Alta precisão: as empresas se autodeclaram
// "energia solar". Traz telefone, site e nº de avaliações (proxy de porte).
//
// Cidades: do body ou de configuracoes_captacao.google_maps_config.cities.
// Formato do jsonb: { "cities": ["Maringá, PR"], "queries": [...], "max_pages": 2 }
//
// POST body opcional:
//   { "cities": ["Maringá, PR"], "queries": ["energia solar"], "maxPages": 2 }
//
// Requer secret GOOGLE_MAPS_API_KEY (Places API habilitada).

import { getServiceClient, logEvento } from "../_shared/supabase.ts";
import { jsonResponse, corsHeaders } from "../_shared/cors.ts";
import { upsertDiscoveredLeads } from "../_shared/leads.ts";
import type { DiscoveredLead } from "../_shared/types.ts";

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const DEFAULT_QUERIES = [
  "energia solar",
  "energia fotovoltaica",
  "instalação de painel solar",
  "integrador solar",
];
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

interface Place {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
}

// "+55 44 3025-1234" → "554430251234"
const toDigits = (phone?: string) => (phone ?? "").replace(/\D/g, "");

// Tenta extrair a UF (2 letras) do fim do endereço formatado.
function ufFromAddress(addr?: string): string | undefined {
  if (!addr) return undefined;
  const m = addr.match(
    /\b([A-Z]{2})\b(?:,?\s*\d{5}-?\d{3})?(?:,\s*Brazil|,\s*Brasil)?$/,
  );
  return m?.[1];
}

function placeToLead(place: Place, city: string): DiscoveredLead {
  const phone = toDigits(place.internationalPhoneNumber);
  return {
    razao_social: place.displayName?.text ?? "(sem nome)",
    fonte: "google_maps",
    fonte_ref: place.id,
    cnpj: null, // Google Maps não traz CNPJ → dedup por (fonte, fonte_ref)
    endereco_cidade: city,
    endereco_uf: ufFromAddress(place.formattedAddress) ?? null,
    telefone: phone.length >= 12 ? phone : null,
    site: place.websiteUri ?? null,
    metadata: {
      formatted_address: place.formattedAddress,
      rating: place.rating,
      user_rating_count: place.userRatingCount,
      google_maps_uri: place.googleMapsUri,
      origem: "discover_google_maps",
    },
  };
}

async function searchCity(
  apiKey: string,
  query: string,
  city: string,
  maxPages: number,
): Promise<DiscoveredLead[]> {
  const leads: DiscoveredLead[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const body: Record<string, unknown> = {
      textQuery: `${query} em ${city}`,
      languageCode: "pt-BR",
      regionCode: "BR",
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Places API ${res.status}: ${await res.text()}`);
    }
    const data = await res.json() as { places?: Place[]; nextPageToken?: string };
    for (const p of data.places ?? []) leads.push(placeToLead(p, city));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return leads;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return jsonResponse({ error: "GOOGLE_MAPS_API_KEY ausente" }, 500);

  const supabase = getServiceClient();
  const reqBody = await req.json().catch(() => ({}));

  // Config do CRM (configuracoes_captacao.google_maps_config), sobrescrita por body.
  const { data: cfgRow } = await supabase
    .from("configuracoes_captacao")
    .select("google_maps_config")
    .eq("id", 1)
    .maybeSingle();
  const gmCfg = (cfgRow?.google_maps_config ?? {}) as {
    cities?: string[];
    queries?: string[];
    max_pages?: number;
  };

  const queries: string[] = reqBody.queries ?? gmCfg.queries ?? DEFAULT_QUERIES;
  const maxPages: number = reqBody.maxPages ?? gmCfg.max_pages ?? 2;
  const cities: string[] = reqBody.cities ?? gmCfg.cities ?? [];

  if (cities.length === 0) {
    return jsonResponse({
      error:
        "Sem cidades. Configure google_maps_config.cities ou passe { cities: [...] }. " +
        "O Google Maps exige uma localidade de busca.",
    }, 400);
  }

  let encontrados = 0;
  let inseridos = 0;
  try {
    for (const city of cities) {
      for (const query of queries) {
        const leads = await searchCity(apiKey, query, city, maxPages);
        encontrados += leads.length;
        const r = await upsertDiscoveredLeads(supabase, leads);
        inseridos += r.inseridos;
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvento(supabase, "alerta", `Erro na captação Google Maps: ${msg}`);
    return jsonResponse({ error: msg }, 502);
  }

  await logEvento(
    supabase,
    "captacao",
    `Google Maps: ${inseridos} novos leads (${encontrados} encontrados em ${cities.length} cidade(s))`,
    { metadata: { encontrados, inseridos, cities } },
  );

  return jsonResponse({ cities: cities.length, encontrados, inseridos });
});
