// Tipos do domínio — espelham o schema REAL do CRM da Heaven (Supabase).
// Enums conferidos no banco (public): lead_status, lead_fonte, lead_porte,
// lead_temperatura, evento_tipo, mensagem_autor, mensagem_tipo.

export type LeadStatus =
  | "bruto"
  | "abordado"
  | "respondeu"
  | "qualificado"
  | "negociacao"
  | "ganho"
  | "perdido";

export type LeadFonte =
  | "google_maps"
  | "receita_federal"
  | "instagram"
  | "linkedin"
  | "indicacao"
  | "manual";

export type LeadPorte = "ME" | "EPP" | "MEDIA" | "GRANDE";

export type LeadTemperatura = "quente" | "morno" | "frio";

export type EventoTipo =
  | "captacao"
  | "mensagem_ia"
  | "resposta_lead"
  | "handoff"
  | "primeira_resposta_vendedor"
  | "venda"
  | "alerta"
  | "status_change";

export type MensagemAutor = "ia" | "lead" | "vendedor";
export type MensagemTipo = "texto" | "imagem" | "arquivo";

// Linha da tabela public.leads (colunas relevantes ao agente).
export interface Lead {
  id: string;
  razao_social: string;
  cnpj: string | null;
  cnae: string | null;
  cnae_descricao: string | null;
  endereco_logradouro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  endereco_cep: string | null;
  telefone: string | null;
  site: string | null;
  decisor_nome: string | null;
  decisor_email: string | null;
  decisor_telefone: string | null;
  porte: LeadPorte | null;
  status: LeadStatus;
  score: number | null;
  fonte: LeadFonte;
  fonte_ref: string | null;
  temperatura: LeadTemperatura | null;
  metadata: Record<string, unknown>;
}

// Resultado normalizado que todo conector de descoberta produz e que o
// upsertDiscoveredLeads grava em public.leads.
export interface DiscoveredLead {
  razao_social: string;
  fonte: LeadFonte;
  fonte_ref?: string | null;
  cnpj?: string | null;
  cnae?: string | null;
  cnae_descricao?: string | null;
  endereco_logradouro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
  telefone?: string | null;
  site?: string | null;
  decisor_email?: string | null;
  metadata?: Record<string, unknown>;
}
