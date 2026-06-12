import type {
  Lead,
  Vendedor,
  Mensagem,
  EventoFeed,
  TimelineEvento,
  Nota,
  Relatorio,
  LeadStatus,
  LeadFonte,
  LeadTemperatura,
} from "@/types";

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=232323`;

export const vendedores: Vendedor[] = [
  { id: "v1", nome: "Carlos Silva", avatar_url: avatar("Carlos"), cargo: "Vendedor Sênior", email: "carlos@heaven.com.br", telefone: "(41) 99812-3344", regiao: "PR", limite_leads_abertos: 40, status: "ativo", meta_mensal: 80000, fechamentos_mes: 62400, ticket_medio: 5200, taxa_conversao: 12.3 },
  { id: "v2", nome: "José Almeida", avatar_url: avatar("Jose"), cargo: "Vendedor", email: "jose@heaven.com.br", telefone: "(11) 98876-2211", regiao: "SP", limite_leads_abertos: 30, status: "ativo", meta_mensal: 70000, fechamentos_mes: 48900, ticket_medio: 4890, taxa_conversao: 9.8 },
  { id: "v3", nome: "Mariana Costa", avatar_url: avatar("Mariana"), cargo: "Vendedora Sênior", email: "mariana@heaven.com.br", telefone: "(47) 99765-1122", regiao: "SC", limite_leads_abertos: 35, status: "ativo", meta_mensal: 75000, fechamentos_mes: 71200, ticket_medio: 5800, taxa_conversao: 14.1 },
  { id: "v4", nome: "Rafael Souza", avatar_url: avatar("Rafael"), cargo: "Vendedor", email: "rafael@heaven.com.br", telefone: "(67) 99432-8765", regiao: "MS", limite_leads_abertos: 30, status: "ativo", meta_mensal: 60000, fechamentos_mes: 31200, ticket_medio: 4100, taxa_conversao: 7.5 },
  { id: "v5", nome: "Patrícia Lima", avatar_url: avatar("Patricia"), cargo: "Vendedora", email: "patricia@heaven.com.br", telefone: "(21) 99213-4567", regiao: "RJ", limite_leads_abertos: 30, status: "ativo", meta_mensal: 65000, fechamentos_mes: 52800, ticket_medio: 4700, taxa_conversao: 11.2 },
  { id: "v6", nome: "Bruno Ferreira", avatar_url: avatar("Bruno"), cargo: "Vendedor", email: "bruno@heaven.com.br", telefone: "(31) 99765-3322", regiao: "MG", limite_leads_abertos: 25, status: "pausado", meta_mensal: 55000, fechamentos_mes: 18900, ticket_medio: 3900, taxa_conversao: 6.4 },
  { id: "v7", nome: "Letícia Rocha", avatar_url: avatar("Leticia"), cargo: "Vendedora", email: "leticia@heaven.com.br", telefone: "(41) 99554-7788", regiao: "PR", limite_leads_abertos: 30, status: "ativo", meta_mensal: 60000, fechamentos_mes: 43200, ticket_medio: 4500, taxa_conversao: 10.6 },
  { id: "v8", nome: "Diego Martins", avatar_url: avatar("Diego"), cargo: "Vendedor Pleno", email: "diego@heaven.com.br", telefone: "(11) 99334-1199", regiao: "SP", limite_leads_abertos: 35, status: "ativo", meta_mensal: 70000, fechamentos_mes: 55600, ticket_medio: 5100, taxa_conversao: 10.9 },
];

const empresas = [
  "Solartech Engenharia LTDA","EnergiaPlus Solar EIRELI","Sol Brasil Integradora ME","Fotovolt Sul LTDA",
  "Heliotec Energia Renovável","Nova Era Solar LTDA","SunPower Curitiba EIRELI","Voltz Engenharia Solar",
  "Raio Verde Energia","Brasil Solar Indústria","Energisul Integradora","Solar Prime Engenharia",
  "EcoVolt Soluções Solares","Helios Engenharia","Brilho Solar Comercial","Mega Solar Distribuidora",
  "Pratika Energia LTDA","Solis Engenharia Solar","Forte Sol Integradora","Norte Solar EIRELI",
  "Premium Solar Brasil","Acende Solar LTDA","Verde Energia Solar","Solplan Engenharia",
  "Astro Solar Curitiba","Geração Solar Sul","Engesol Engenharia","Sol Total Energia",
  "Vitória Solar EIRELI","Aliança Solar LTDA","Cristal Solar Engenharia","Polo Solar Brasil",
  "Bandeira Solar LTDA","Energia Real Solar","SolarFix Integradora","Conecte Solar EIRELI",
  "Caminho Solar Engenharia","Stream Solar LTDA","Origem Solar Brasil","Praia Solar Energia",
  "Atlas Solar LTDA","Pampa Solar Sul","ForteVolt Engenharia","Lumen Solar EIRELI",
  "Cruzeiro Solar LTDA","SolMax Brasil","Aurora Solar Integradora","Onda Solar Energia",
  "Galáxia Solar EIRELI","Premium Volt Brasil","Sertão Solar LTDA","Vale Solar Engenharia",
  "Mirante Solar EIRELI","Conexa Solar Brasil","Estrela Solar LTDA","Pulse Solar Energia",
  "EnergyOn Integradora","Brisa Solar Brasil","Mar Solar EIRELI","Capricho Solar LTDA",
];

const cnaes = [
  { c: "35.11-5/01", d: "Geração de energia elétrica" },
  { c: "43.21-5/00", d: "Instalação e manutenção elétrica" },
  { c: "71.12-0/00", d: "Serviços de engenharia" },
  { c: "47.42-3/00", d: "Comércio varejista de materiais elétricos" },
];

const cidades = [
  ["Curitiba","PR","80010-000"],["São Paulo","SP","01310-100"],["Joinville","SC","89201-001"],
  ["Campo Grande","MS","79002-200"],["Rio de Janeiro","RJ","20040-020"],["Belo Horizonte","MG","30130-010"],
  ["Londrina","PR","86010-000"],["Campinas","SP","13010-001"],["Florianópolis","SC","88010-400"],
];

const tagsPool = ["Hot lead","Quer orçamento","Comparando","Pagamento à vista","Indicação cliente","Grande projeto","Telhado cerâmico","Telhado metálico","Solo","Industrial"];

const statusOrder: LeadStatus[] = ["bruto","abordado","respondeu","qualificado","negociacao","ganho","perdido"];
const statusCounts: Record<LeadStatus, number> = { bruto:15, abordado:12, respondeu:10, qualificado:8, negociacao:8, ganho:5, perdido:2 };
const fontes: LeadFonte[] = ["google_maps","receita_federal","indicacao"];

function rng(seed: number) { let x = seed; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }

const r = rng(42);
function gerarCNPJ(i: number) {
  const base = (12345678 + i * 137).toString().padStart(8, "0").slice(-8);
  return `${base.slice(0,2)}.${base.slice(2,5)}.${base.slice(5,8)}/0001-${(10 + i % 89).toString()}`;
}

export const leads: Lead[] = [];
let idx = 0;
for (const status of statusOrder) {
  for (let i = 0; i < statusCounts[status]; i++) {
    const ci = Math.floor(r() * cidades.length);
    const cn = cnaes[Math.floor(r() * cnaes.length)];
    const f = fontes[Math.floor(r() * fontes.length)];
    const score = Math.floor(r() * 100);
    const temp: LeadTemperatura = score > 75 ? "quente" : score > 45 ? "morno" : "frio";
    const vendedor = status === "bruto" ? undefined : vendedores[Math.floor(r() * vendedores.length)].id;
    const valor = 2000 + Math.floor(r() * 12000);
    leads.push({
      id: `l${idx + 1}`,
      razao_social: empresas[idx % empresas.length],
      cnpj: gerarCNPJ(idx),
      cnae: cn.c,
      cnae_descricao: cn.d,
      endereco: { logradouro: `Av. das Indústrias, ${100 + idx * 7}`, cidade: cidades[ci][0], uf: cidades[ci][1], cep: cidades[ci][2] },
      telefone: `(${10 + Math.floor(r()*80)}) 9${Math.floor(r()*9000+1000)}-${Math.floor(r()*9000+1000)}`,
      site: r() > 0.4 ? `https://www.${empresas[idx % empresas.length].toLowerCase().split(" ")[0]}.com.br` : undefined,
      decisor: {
        nome: ["João Pedro","Mariana Alves","Ricardo Borges","Camila Souza","Fernando Lima","Juliana Castro","Eduardo Pires","Tatiane Reis"][idx % 8],
        cargo: ["Diretor Comercial","CEO","Gerente de Compras","Engenheiro Responsável","Sócio-Proprietário"][idx % 5],
        telefone: `(${10 + Math.floor(r()*80)}) 9${Math.floor(r()*9000+1000)}-${Math.floor(r()*9000+1000)}`,
        email: `contato@${empresas[idx % empresas.length].toLowerCase().split(" ")[0]}.com.br`,
      },
      porte: (["ME","EPP","MEDIA","GRANDE"] as const)[Math.floor(r()*4)],
      capital_social: 50000 + Math.floor(r() * 950000),
      status,
      score,
      fonte: f,
      temperatura: temp,
      vendedor_id: vendedor,
      tags: [tagsPool[Math.floor(r()*tagsPool.length)], tagsPool[Math.floor(r()*tagsPool.length)]].filter((v,i,a)=>a.indexOf(v)===i),
      ultimo_contato: new Date(Date.now() - Math.floor(r() * 7 * 86400000)),
      criado_em: new Date(Date.now() - Math.floor(r() * 30 * 86400000)),
      valor_estimado: valor,
      bling_cliente_id: status === "ganho" ? `BL-${1000+idx}` : undefined,
    });
    idx++;
  }
}

function gerarConversa(leadId: string, comHandoff: boolean): Mensagem[] {
  const base = new Date(Date.now() - 86400000);
  const ms: Mensagem[] = [
    { id: `${leadId}-m1`, autor: "ia", conteudo: "Olá! Aqui é a Heaven, somos fornecedores de estruturas para painéis fotovoltaicos. Vi que vocês atuam com energia solar — podemos ajudar com suporte para os projetos?", timestamp: new Date(base.getTime() + 0), tipo: "texto" },
    { id: `${leadId}-m2`, autor: "lead", conteudo: "Oi! Tudo bem? Trabalhamos com instalação residencial e comercial sim.", timestamp: new Date(base.getTime() + 60000 * 3), tipo: "texto" },
    { id: `${leadId}-m3`, autor: "ia", conteudo: "Perfeito! Vocês compram estrutura de quem hoje? E qual o volume médio mensal de projetos?", timestamp: new Date(base.getTime() + 60000 * 5), tipo: "texto" },
    { id: `${leadId}-m4`, autor: "lead", conteudo: "Hoje compramos de um fornecedor de SP, fazemos uns 8-12 sistemas/mês.", timestamp: new Date(base.getTime() + 60000 * 12), tipo: "texto" },
    { id: `${leadId}-m5`, autor: "ia", conteudo: "Ótimo volume! Trabalhamos com trilhos, ganchos e clamps para todos os tipos de telhado. Posso te encaminhar pro nosso consultor que monta uma cotação personalizada?", timestamp: new Date(base.getTime() + 60000 * 14), tipo: "texto" },
    { id: `${leadId}-m6`, autor: "lead", conteudo: "Pode sim, manda o contato.", timestamp: new Date(base.getTime() + 60000 * 20), tipo: "texto" },
  ];
  if (comHandoff) {
    ms.push(
      { id: `${leadId}-m7`, autor: "vendedor", autor_nome: "Carlos Silva", conteudo: "Oi! Carlos da Heaven aqui. Posso te enviar nosso catálogo e fechar uma proposta agora mesmo?", timestamp: new Date(base.getTime() + 60000 * 30), tipo: "texto" },
      { id: `${leadId}-m8`, autor: "lead", conteudo: "Por favor! Preciso para projeto de 25kWp em telhado metálico.", timestamp: new Date(base.getTime() + 60000 * 35), tipo: "texto" },
      { id: `${leadId}-m9`, autor: "vendedor", autor_nome: "Carlos Silva", conteudo: "Perfeito. Pra 25kWp em metálico recomendo nosso kit Premium com trilho 4.6m + grampos mid 40mm. Te mando agora a planilha.", timestamp: new Date(base.getTime() + 60000 * 38), tipo: "texto" },
      { id: `${leadId}-m10`, autor: "lead", conteudo: "Top, aguardo!", timestamp: new Date(base.getTime() + 60000 * 42), tipo: "texto" },
    );
  }
  return ms;
}

export const conversas: Record<string, Mensagem[]> = {};
leads.slice(0, 8).forEach((l, i) => { conversas[l.id] = gerarConversa(l.id, i % 2 === 0); });

const feedTextos: Array<[EventoFeed["tipo"], string]> = [
  ["captacao", "**Solar BR** captado via Google Maps"],
  ["mensagem_ia", "**IA** enviou abertura para **Solartech LTDA**"],
  ["resposta", "**EnergiaPlus** respondeu em 4 minutos"],
  ["handoff", "**IA** transferiu **Voltz Engenharia** para **Carlos**"],
  ["venda", "**Carlos** fechou venda de R$ 6.420 com **EnergiaPlus**"],
  ["alerta", "Lead **Fotovolt Sul** sem ação há 24h"],
  ["captacao", "**Helios Engenharia** captado via Receita Federal"],
  ["mensagem_ia", "**IA** qualificou **Nova Era Solar** com score 87"],
  ["resposta", "**SunPower Curitiba** marcou reunião para amanhã"],
  ["venda", "**Mariana** fechou venda de R$ 8.900 com **Sol Brasil**"],
  ["captacao", "**EcoVolt** captado via Google Maps"],
  ["handoff", "**IA** transferiu **Brilho Solar** para **Patrícia**"],
  ["mensagem_ia", "**IA** reativou **Pratika Energia** (tentativa 2)"],
  ["resposta", "**Solis Engenharia** pediu catálogo completo"],
  ["captacao", "**Forte Sol** captado via Indicação"],
];

export const feed: EventoFeed[] = feedTextos.map((t, i) => ({
  id: `f${i}`,
  timestamp: new Date(Date.now() - i * 1000 * 60 * (3 + Math.floor(Math.random() * 12))),
  tipo: t[0],
  texto: t[1],
}));

export const timelineMock: TimelineEvento[] = [
  { id: "t1", timestamp: new Date(Date.now() - 86400000 * 3), tipo: "criacao", texto: "Lead captado via Google Maps" },
  { id: "t2", timestamp: new Date(Date.now() - 86400000 * 3 + 3600000), tipo: "mensagem", texto: "IA enviou mensagem de abertura" },
  { id: "t3", timestamp: new Date(Date.now() - 86400000 * 2), tipo: "mensagem", texto: "Lead respondeu" },
  { id: "t4", timestamp: new Date(Date.now() - 86400000 * 2 + 1800000), tipo: "mudanca_status", texto: "Mudou de 'Abordado' para 'Respondeu'" },
  { id: "t5", timestamp: new Date(Date.now() - 86400000), tipo: "handoff", texto: "Transferido para Carlos Silva", autor: "IA" },
  { id: "t6", timestamp: new Date(Date.now() - 3600000 * 4), tipo: "nota", texto: "Cliente quer fechar até sexta", autor: "Carlos Silva" },
];

export const notasMock: Nota[] = [
  { id: "n1", autor: "Carlos Silva", texto: "Decisor pediu desconto de 8%. Avaliar com gerente.", timestamp: new Date(Date.now() - 86400000) },
  { id: "n2", autor: "Mariana Costa", texto: "Empresa indicada por outro cliente da carteira.", timestamp: new Date(Date.now() - 86400000 * 4) },
];

export const relatorios: Relatorio[] = [
  { id: "r1", periodo: "Outubro 2025", gerado_em: new Date(2025, 10, 1), tamanho: "2.4 MB" },
  { id: "r2", periodo: "Setembro 2025", gerado_em: new Date(2025, 9, 1), tamanho: "2.1 MB" },
  { id: "r3", periodo: "Agosto 2025", gerado_em: new Date(2025, 8, 1), tamanho: "2.3 MB" },
  { id: "r4", periodo: "Julho 2025", gerado_em: new Date(2025, 7, 1), tamanho: "1.9 MB" },
  { id: "r5", periodo: "Junho 2025", gerado_em: new Date(2025, 6, 1), tamanho: "2.0 MB" },
  { id: "r6", periodo: "Maio 2025", gerado_em: new Date(2025, 5, 1), tamanho: "1.8 MB" },
];

export const statusLabels: Record<LeadStatus, string> = {
  bruto: "Lead bruto",
  abordado: "Abordado",
  respondeu: "Respondeu",
  qualificado: "Qualificado",
  negociacao: "Em negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const fonteLabels: Record<LeadFonte, string> = {
  google_maps: "Google Maps",
  receita_federal: "Receita Federal",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  indicacao: "Indicação",
  manual: "Manual",
};

export const fonteCores: Record<LeadFonte, string> = {
  google_maps: "bg-info/15 text-info border-info/30",
  receita_federal: "bg-heaven-orange/15 text-heaven-orange border-heaven-orange/30",
  instagram: "bg-heaven-rust/15 text-heaven-orange border-heaven-rust/30",
  linkedin: "bg-info/15 text-info border-info/30",
  indicacao: "bg-success/15 text-success border-success/30",
  manual: "bg-muted text-muted-foreground border-border",
};

export const statusCores: Record<LeadStatus, string> = {
  bruto: "bg-heaven-gray",
  abordado: "bg-heaven-orange/60",
  respondeu: "bg-heaven-orange",
  qualificado: "bg-heaven-orange-deep",
  negociacao: "bg-info",
  ganho: "bg-success",
  perdido: "bg-danger",
};
