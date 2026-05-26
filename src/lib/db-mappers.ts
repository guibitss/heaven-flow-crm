import type { Lead, LeadStatus, LeadFonte, LeadTemperatura, Vendedor } from "@/types";

export function mapLeadFromDb(r: any): Lead {
  return {
    id: r.id,
    razao_social: r.razao_social,
    cnpj: r.cnpj,
    cnae: r.cnae ?? "",
    cnae_descricao: r.cnae_descricao ?? "",
    endereco: {
      logradouro: r.endereco_logradouro ?? "",
      cidade: r.endereco_cidade ?? "",
      uf: r.endereco_uf ?? "",
      cep: r.endereco_cep ?? "",
    },
    telefone: r.telefone ?? "",
    site: r.site ?? undefined,
    decisor: {
      nome: r.decisor_nome ?? "",
      cargo: r.decisor_cargo ?? "",
      telefone: r.decisor_telefone ?? "",
      email: r.decisor_email ?? undefined,
    },
    porte: r.porte ?? "ME",
    capital_social: Number(r.capital_social ?? 0),
    status: r.status as LeadStatus,
    score: r.score ?? 50,
    fonte: (r.fonte === "manual" ? "indicacao" : r.fonte) as LeadFonte,
    temperatura: (r.temperatura ?? "morno") as LeadTemperatura,
    vendedor_id: r.vendedor_id ?? undefined,
    tags: [],
    ultimo_contato: r.ultimo_contato ? new Date(r.ultimo_contato) : new Date(r.criado_em),
    criado_em: new Date(r.criado_em),
    valor_estimado: r.valor_estimado ? Number(r.valor_estimado) : undefined,
    bling_cliente_id: r.bling_cliente_id ?? undefined,
    // extra (not in original type but we'll cast)
    ...(r.handoff_em && { handoff_em: r.handoff_em }),
    ...(r.primeira_resposta_vendedor_em && { primeira_resposta_vendedor_em: r.primeira_resposta_vendedor_em }),
    ...(r.tempo_primeira_resposta_segundos !== null && { tempo_primeira_resposta_segundos: r.tempo_primeira_resposta_segundos }),
  } as any;
}

export function mapVendedorFromDb(r: any): Vendedor {
  return {
    id: r.id,
    nome: r.nome,
    avatar_url: r.avatar_url ?? "",
    cargo: r.cargo ?? "",
    email: r.email,
    telefone: r.telefone ?? "",
    regiao: r.regiao ?? "",
    limite_leads_abertos: r.limite_leads_abertos ?? 50,
    status: r.status,
    meta_mensal: Number(r.meta_mensal ?? 0),
    fechamentos_mes: Number(r.fechamentos_mes ?? 0),
    ticket_medio: Number(r.ticket_medio ?? 0),
    taxa_conversao: Number(r.taxa_conversao ?? 0),
  };
}
