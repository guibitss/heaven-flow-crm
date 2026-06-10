import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { DiscoveredLead } from "./types.ts";

export interface UpsertResult {
  recebidos: number;
  inseridos: number;
}

function rowFor(l: DiscoveredLead) {
  return {
    razao_social: l.razao_social,
    fonte: l.fonte,
    fonte_ref: l.fonte_ref ?? null,
    cnpj: l.cnpj ?? null,
    cnae: l.cnae ?? null,
    cnae_descricao: l.cnae_descricao ?? null,
    endereco_logradouro: l.endereco_logradouro ?? null,
    endereco_cidade: l.endereco_cidade ?? null,
    endereco_uf: l.endereco_uf ?? null,
    endereco_cep: l.endereco_cep ?? null,
    telefone: l.telefone ?? null,
    site: l.site ?? null,
    decisor_email: l.decisor_email ?? null,
    metadata: l.metadata ?? {},
  };
}

// Insere leads descobertos em public.leads, deduplicando:
//   - por CNPJ (constraint UNIQUE) quando há CNPJ (ex.: Receita Federal);
//   - por (fonte, fonte_ref) quando não há CNPJ (ex.: place_id do Google Maps).
// ignoreDuplicates: a descoberta NUNCA sobrescreve um lead já existente
// (preserva status/score de quem já está no funil). Retorna quantos eram novos.
export async function upsertDiscoveredLeads(
  client: SupabaseClient,
  leads: DiscoveredLead[],
): Promise<UpsertResult> {
  const comCnpj = leads.filter((l) => l.cnpj);
  const comRef = leads.filter((l) => !l.cnpj && l.fonte_ref);

  let inseridos = 0;

  if (comCnpj.length) {
    const { data, error } = await client
      .from("leads")
      .upsert(comCnpj.map(rowFor), { onConflict: "cnpj", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(`upsert por cnpj: ${error.message}`);
    inseridos += data?.length ?? 0;
  }

  if (comRef.length) {
    const { data, error } = await client
      .from("leads")
      .upsert(comRef.map(rowFor), {
        onConflict: "fonte,fonte_ref",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) throw new Error(`upsert por fonte_ref: ${error.message}`);
    inseridos += data?.length ?? 0;
  }

  return { recebidos: leads.length, inseridos };
}
