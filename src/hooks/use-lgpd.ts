// use-lgpd — dados reais de compliance: lgpd_solicitacoes, blacklist,
// lead_consentimentos (opt-out) e exportação de portabilidade.
// Consumido por src/routes/_app/lgpd.tsx.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------- solicitações

export type SolicitacaoTipo = "acesso" | "exclusao" | "portabilidade" | "oposicao";
export type SolicitacaoStatus = "pendente" | "em_andamento" | "resolvida";

export function useLgpdSolicitacoes() {
  return useQuery({
    queryKey: ["lgpd_solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgpd_solicitacoes")
        .select("*")
        .order("solicitada_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNovaSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tipo: SolicitacaoTipo;
      titular_email: string;
      titular_documento?: string;
      detalhes?: string;
    }) => {
      const { error } = await supabase.from("lgpd_solicitacoes").insert({
        tipo: input.tipo,
        titular_email: input.titular_email,
        titular_documento: input.titular_documento || null,
        detalhes: input.detalhes || null,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lgpd_solicitacoes"] });
      toast.success("Solicitação registrada");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao registrar solicitação"),
  });
}

export function useAtualizarStatusSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: SolicitacaoStatus; resolvidaPor?: string | null }) => {
      const resolvida = input.status === "resolvida";
      const patch = {
        status: input.status,
        resolvida_em: resolvida ? new Date().toISOString() : null,
        resolvida_por: resolvida ? (input.resolvidaPor ?? null) : null,
      };
      const { error } = await supabase.from("lgpd_solicitacoes").update(patch).eq("id", input.id);
      if (error) throw error;
      return input.status;
    },
    onSuccess: (status) => {
      qc.invalidateQueries({ queryKey: ["lgpd_solicitacoes"] });
      toast.success(
        status === "resolvida" ? "Solicitação marcada como resolvida" : "Status atualizado",
      );
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao atualizar status"),
  });
}

// ------------------------------------------------------------------- blacklist

export function useBlacklist() {
  return useQuery({
    queryKey: ["blacklist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blacklist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddBlacklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { cnpj: string; razao_social?: string; motivo?: string; adicionadoPor?: string | null }) => {
      const { error } = await supabase.from("blacklist").insert({
        cnpj: input.cnpj,
        razao_social: input.razao_social || null,
        motivo: input.motivo || null,
        adicionado_por: input.adicionadoPor ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blacklist"] });
      toast.success("CNPJ adicionado à blacklist");
    },
    onError: (e: Error) => {
      if (e.message?.toLowerCase().includes("duplicate")) {
        toast.error("Este CNPJ já está na blacklist");
      } else {
        toast.error(e.message || "Erro ao adicionar à blacklist");
      }
    },
  });
}

export function useRemoveBlacklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blacklist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blacklist"] });
      toast.success("CNPJ removido da blacklist");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao remover da blacklist"),
  });
}

// --------------------------------------------------------------------- opt-out

export function useOptOuts() {
  return useQuery({
    queryKey: ["lead_consentimentos", "opt_out"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_consentimentos")
        .select("id, lead_id, opt_out, opt_out_em, origem, lead:leads(id, razao_social)")
        .eq("opt_out", true)
        .order("opt_out_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// --------------------------------------------------------------- portabilidade

export type ExportPortabilidade = {
  lead: Record<string, unknown>;
  mensagens: Record<string, unknown>[];
} | null;

export function useExportarPortabilidade() {
  return useMutation({
    mutationFn: async (termo: string): Promise<ExportPortabilidade> => {
      const t = termo.trim();
      if (!t) return null;
      const digitos = t.replace(/\D/g, "");
      const filtros = [`decisor_email.ilike.%${t}%`];
      if (digitos.length >= 8) {
        filtros.push(`telefone.ilike.%${digitos}%`, `decisor_telefone.ilike.%${digitos}%`);
      }
      const { data: lead, error } = await supabase
        .from("leads")
        .select("*")
        .or(filtros.join(","))
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!lead) return null;

      const { data: mensagens, error: errMsg } = await supabase
        .from("mensagens")
        .select("autor, conteudo, tipo, enviada_em")
        .eq("lead_id", lead.id)
        .order("enviada_em", { ascending: true });
      if (errMsg) throw errMsg;

      return { lead, mensagens: mensagens ?? [] };
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao buscar dados para exportação"),
  });
}

/** Dispara o download de um JSON de portabilidade no navegador. */
export function baixarJsonPortabilidade(payload: NonNullable<ExportPortabilidade>) {
  const corpo = {
    gerado_em: new Date().toISOString(),
    base_legal: "Art. 18, V da LGPD — portabilidade dos dados a outro fornecedor",
    lead: payload.lead,
    mensagens: payload.mensagens,
  };
  const blob = new Blob([JSON.stringify(corpo, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const razao = String((payload.lead as { razao_social?: string }).razao_social ?? "titular")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  a.download = `portabilidade-${razao}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
