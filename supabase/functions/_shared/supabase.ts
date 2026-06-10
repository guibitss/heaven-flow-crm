import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { EventoTipo } from "./types.ts";

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// Registra um evento no feed do CRM (tabela eventos_feed). O `tipo` precisa ser
// um valor do enum evento_tipo do banco.
export async function logEvento(
  client: SupabaseClient,
  tipo: EventoTipo,
  texto: string,
  opts: { leadId?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  await client.from("eventos_feed").insert({
    tipo,
    texto,
    lead_id: opts.leadId ?? null,
    metadata: opts.metadata ?? {},
  });
}
