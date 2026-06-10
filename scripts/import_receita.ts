#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net --env-file=.env
// ETL local — importa o arquivo "Estabelecimentos" dos Dados Abertos da Receita
// Federal e grava o subconjunto-alvo DIRETO na tabela `leads` do CRM da Heaven.
//
// Filtra por: situação ativa (02) + CNAE-alvo + (por padrão) nome com termo solar.
// Assim só vira lead quem é realmente do público da Heaven — o "gate" solar roda
// aqui, antes de poluir o funil. A qualificação (score/temperatura) roda depois,
// na Edge Function qualify_lead.
//
// Config (CNAEs e UFs) vem de configuracoes_captacao.receita_config no banco, mas
// pode ser sobrescrita por flags. Formato esperado do jsonb:
//   { "cnaes": ["4321500", ...], "ufs": ["PR","SP"], "solar_gate": true }
//
// Fonte dos arquivos (baixe e descompacte antes de rodar):
//   https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj/
//
// Uso:
//   deno run --allow-read --allow-env --allow-net --env-file=.env \
//     scripts/import_receita.ts --dir ./receita_csv [--cnae 4321500,3511501] \
//     [--uf PR,SP] [--no-solar-gate]

import { createClient } from "jsr:@supabase/supabase-js@2";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { looksSolar } from "../supabase/functions/_shared/solar.ts";

// CNAEs-alvo padrão (somente dígitos, 7 chars). REVISAR com o público da Heaven.
const DEFAULT_CNAES = [
  "4321500", // Instalação e manutenção elétrica
  "3511501", // Geração de energia elétrica
  "4221904", // Construção de redes de distribuição de energia elétrica
  "7112000", // Serviços de engenharia
  "4754702", // Comércio varejista de artigos de iluminação
];

const SITUACAO_ATIVA = "02";
const BATCH_SIZE = 500;

const onlyDigits = (s: string) => (s ?? "").replace(/\D/g, "");

// Telefone -> "55" + DDD + número (E.164 simplificado). null se inválido.
function toPhone(ddd: string, num: string): string | null {
  const d = onlyDigits(`${ddd}${num}`);
  if (d.length < 10) return null;
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
}

// Parser de uma linha CSV da Receita: campos entre aspas duplas, separados por ';'.
export function parseLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ";" && !inQuotes) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

// Lê um arquivo grande em latin1, emitindo linha a linha sem carregar tudo na RAM.
async function* readLinesLatin1(path: string): AsyncGenerator<string> {
  const decoder = new TextDecoder("latin1");
  const file = await Deno.open(path, { read: true });
  const buf = new Uint8Array(1 << 20); // 1 MiB
  let remainder = "";
  while (true) {
    const n = await file.read(buf);
    if (n === null) break;
    const chunk = decoder.decode(buf.subarray(0, n), { stream: true });
    const text = remainder + chunk;
    const lines = text.split("\n");
    remainder = lines.pop() ?? "";
    for (const l of lines) yield l.replace(/\r$/, "");
  }
  if (remainder) yield remainder.replace(/\r$/, "");
  file.close();
}

// Linha pronta para inserir em public.leads (fonte=receita_federal).
function leadFromFields(f: string[]) {
  const cnpj = `${f[0] ?? ""}${f[1] ?? ""}${f[2] ?? ""}`; // basico+ordem+dv (14)
  const nomeFantasia = f[4] ?? "";
  const logradouro = [f[13], f[14], f[15]].filter(Boolean).join(" ").trim();
  return {
    fonte: "receita_federal" as const,
    cnpj,
    razao_social: nomeFantasia || `CNPJ ${cnpj}`,
    cnae: onlyDigits(f[11] ?? "") || null,
    endereco_logradouro: logradouro || null,
    endereco_cidade: null, // só temos o código IBGE do município (vai no metadata)
    endereco_uf: (f[19] ?? "") || null,
    endereco_cep: (f[18] ?? "") || null,
    telefone: toPhone(f[21] ?? "", f[22] ?? ""),
    decisor_email: ((f[27] ?? "").toLowerCase()) || null,
    metadata: {
      nome_fantasia: nomeFantasia || null,
      cnae_secundaria: f[12] ?? null,
      municipio_codigo: f[20] ?? null,
      data_inicio_atividade: f[10] ?? null,
      telefone_2: toPhone(f[23] ?? "", f[24] ?? ""),
      origem: "import_receita",
    },
  };
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ["dir", "file", "cnae", "uf"],
    boolean: ["no-solar-gate"],
  });

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env");
    Deno.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Config do CRM (configuracoes_captacao.receita_config), sobrescrita por flags.
  const { data: cfgRow } = await supabase
    .from("configuracoes_captacao")
    .select("receita_config")
    .eq("id", 1)
    .maybeSingle();
  const receitaCfg = (cfgRow?.receita_config ?? {}) as {
    cnaes?: string[];
    ufs?: string[];
    solar_gate?: boolean;
  };

  const targets = new Set(
    (args.cnae
      ? args.cnae.split(",")
      : (receitaCfg.cnaes?.length ? receitaCfg.cnaes : DEFAULT_CNAES))
      .map(onlyDigits),
  );
  const ufFilter = new Set(
    (args.uf ? args.uf.split(",") : (receitaCfg.ufs ?? []))
      .map((u) => u.trim().toUpperCase())
      .filter(Boolean),
  );
  // Gate solar liga por padrão; desliga com --no-solar-gate ou solar_gate:false.
  const solarGate = args["no-solar-gate"] === true
    ? false
    : (receitaCfg.solar_gate ?? true);

  const files: string[] = [];
  if (args.file) files.push(args.file);
  if (args.dir) {
    for await (const entry of Deno.readDir(args.dir)) {
      if (entry.isFile) files.push(`${args.dir}/${entry.name}`);
    }
  }
  if (files.length === 0) {
    console.error("Informe --dir <pasta com CSVs> ou --file <arquivo>");
    Deno.exit(1);
  }

  console.log(`CNAEs-alvo: ${[...targets].join(", ")}`);
  console.log(`UFs: ${ufFilter.size ? [...ufFilter].join(", ") : "(todas)"}`);
  console.log(`Gate solar: ${solarGate ? "on" : "off"}`);
  console.log(`Arquivos: ${files.length}`);

  let scanned = 0;
  let inseridos = 0;
  let batch: ReturnType<typeof leadFromFields>[] = [];

  async function flush() {
    if (batch.length === 0) return;
    const { data, error } = await supabase
      .from("leads")
      .upsert(batch, { onConflict: "cnpj", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error("Erro no upsert:", error.message);
    } else {
      inseridos += data?.length ?? 0;
      console.log(`  +${data?.length ?? 0} novos (total: ${inseridos})`);
    }
    batch = [];
  }

  for (const path of files) {
    console.log(`\nLendo ${path} ...`);
    for await (const line of readLinesLatin1(path)) {
      if (!line) continue;
      scanned++;
      if (scanned % 500_000 === 0) {
        console.log(`  ...${scanned.toLocaleString()} linhas lidas`);
      }
      const f = parseLine(line);
      if ((f[5] ?? "") !== SITUACAO_ATIVA) continue; // só ativas
      const principal = onlyDigits(f[11] ?? "");
      const secundarias = (f[12] ?? "").split(",").map(onlyDigits);
      const cnaeHit = targets.has(principal) ||
        secundarias.some((c) => targets.has(c));
      if (!cnaeHit) continue;
      if (ufFilter.size && !ufFilter.has((f[19] ?? "").toUpperCase())) continue;
      if (solarGate && !looksSolar(f[4] ?? "")) continue; // f[4] = nome_fantasia

      batch.push(leadFromFields(f));
      if (batch.length >= BATCH_SIZE) await flush();
    }
  }
  await flush();

  console.log(
    `\nConcluído. Linhas lidas: ${scanned.toLocaleString()}, leads novos: ${inseridos.toLocaleString()}`,
  );
}

if (import.meta.main) await main();
