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
export type LeadTemperatura = "quente" | "morno" | "frio";

export interface Lead {
  id: string;
  razao_social: string;
  cnpj: string;
  cnae: string;
  cnae_descricao: string;
  endereco: { logradouro: string; cidade: string; uf: string; cep: string };
  telefone: string;
  site?: string;
  decisor: { nome: string; cargo: string; telefone: string; email?: string };
  porte: "ME" | "EPP" | "MEDIA" | "GRANDE";
  capital_social: number;
  status: LeadStatus;
  score: number;
  fonte: LeadFonte;
  temperatura: LeadTemperatura;
  vendedor_id?: string;
  tags: string[];
  ultimo_contato: Date;
  criado_em: Date;
  valor_estimado?: number;
  bling_cliente_id?: string;
}

export interface Vendedor {
  id: string;
  nome: string;
  avatar_url: string;
  cargo: string;
  email: string;
  telefone: string;
  regiao: string;
  limite_leads_abertos: number;
  status: "ativo" | "pausado";
  meta_mensal: number;
  fechamentos_mes: number;
  ticket_medio: number;
  taxa_conversao: number;
}

export interface Mensagem {
  id: string;
  autor: "ia" | "lead" | "vendedor";
  autor_nome?: string;
  conteudo: string;
  timestamp: Date;
  tipo: "texto" | "imagem" | "arquivo";
}

export interface EventoFeed {
  id: string;
  timestamp: Date;
  tipo: "captacao" | "mensagem_ia" | "resposta" | "handoff" | "venda" | "alerta";
  texto: string;
}

export interface TimelineEvento {
  id: string;
  timestamp: Date;
  tipo: "criacao" | "mensagem" | "mudanca_status" | "nota" | "handoff" | "venda";
  texto: string;
  autor?: string;
}

export interface Nota {
  id: string;
  autor: string;
  texto: string;
  timestamp: Date;
}

export interface Relatorio {
  id: string;
  periodo: string;
  gerado_em: Date;
  tamanho: string;
}
