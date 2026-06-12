// Testes de lógica pura — não precisam de Docker, banco ou rede.
// Rodar: deno test --allow-read --allow-env

import { assert, assertEquals } from "jsr:@std/assert";
import { looksSolar } from "../supabase/functions/_shared/solar.ts";
import {
  extractEmail,
  extractPhoneBR,
} from "../supabase/functions/_shared/instagram.ts";
import { parseLine } from "../scripts/import_receita.ts";
import { formatCnae, cnaePrefix } from "../supabase/functions/_shared/cnae.ts";

Deno.test("formatCnae: dígitos puros viram formato pontuado do score nativo", () => {
  assertEquals(formatCnae("4321500"), "43.21-5/00");
  assertEquals(formatCnae("3511501"), "35.11-5/01");
  assertEquals(formatCnae("43.21-5/00"), "43.21-5/00"); // idempotente
  assertEquals(formatCnae("123"), ""); // inválido
  assertEquals(cnaePrefix("43.21-5/00"), "43.21");
});

Deno.test("looksSolar: aceita nomes do setor solar", () => {
  assert(looksSolar("SOLARTECH ENERGIA LTDA"));
  assert(looksSolar("Sun Power Fotovoltaica"));
  assert(looksSolar("Energia Solar do Vale"));
  assert(looksSolar("INTEGRADORA FOTOVOLTAICA XPTO"));
});

Deno.test("looksSolar: rejeita eletricista genérico e evita falso positivo", () => {
  assert(!looksSolar("JOÃO ELÉTRICA PREDIAL"));
  assert(!looksSolar("Instalações Elétricas Beta"));
  assert(!looksSolar("SOLENOIDE INDUSTRIAL")); // não pode casar "solenoide"
  assert(!looksSolar(""));
});

Deno.test("parseLine: CSV da Receita (aspas + ;)", () => {
  const line =
    '"12345678";"0001";"95";"2";"SOLAR XPTO";"02";"20200101";"0";"";"105";"20200101";"4321500";"";"RUA";"DAS FLORES";"100";"";"CENTRO";"87000000";"PR";"6207";"44";"30251234";"";"";"";"";"contato@solarxpto.com.br";"";""';
  const f = parseLine(line);
  assertEquals(f[0], "12345678"); // cnpj_basico
  assertEquals(f[4], "SOLAR XPTO"); // nome_fantasia
  assertEquals(f[5], "02"); // situação ativa
  assertEquals(f[11], "4321500"); // cnae principal
  assertEquals(f[19], "PR"); // uf
  assertEquals(f[27], "contato@solarxpto.com.br"); // email
});

Deno.test("extractEmail / extractPhoneBR: parsing de bio", () => {
  assertEquals(
    extractEmail("Energia solar ☀️ orçamento: vendas@heaven.com.br"),
    "vendas@heaven.com.br",
  );
  assertEquals(extractPhoneBR("WhatsApp (44) 99999-8888"), "5544999998888");
  assertEquals(extractPhoneBR("fale: +55 44 3025-1234"), "554430251234");
  assertEquals(extractPhoneBR("sem telefone aqui"), undefined);
});
