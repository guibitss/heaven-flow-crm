// Hooks da tela de Captação — tudo persistido em configuracoes_captacao id=1.
// Os jsonbs receita_config / google_maps_config têm a forma definida abaixo.

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CaptacaoRow =
  Database["public"]["Tables"]["configuracoes_captacao"]["Row"];
type CaptacaoUpdate =
  Database["public"]["Tables"]["configuracoes_captacao"]["Update"];
type EventoFeed = Database["public"]["Tables"]["eventos_feed"]["Row"];

export interface ReceitaConfig {
  /** Prefixos de CNAE com ponto, ex. '43.21'. */
  cnaes: string[];
  /** Siglas de UF; vazio = Brasil inteiro. */
  ufs: string[];
  /** Só razões sociais com termo solar viram lead. */
  solar_gate: boolean;
  volume_diario_max: number;
}

export interface GoogleMapsConfig {
  /** Ex. 'Maringá, PR'. */
  cities: string[];
  queries: string[];
  /** 1–3 páginas (~20 resultados cada). */
  max_pages: number;
}

export const DEFAULT_RECEITA_CONFIG: ReceitaConfig = {
  cnaes: ["35.11", "43.21", "43.22", "71.12", "47.42"],
  ufs: [],
  solar_gate: true,
  volume_diario_max: 100,
};

export const DEFAULT_MAPS_CONFIG: GoogleMapsConfig = {
  cities: [],
  queries: [
    "energia solar",
    "energia fotovoltaica",
    "instalação de painel solar",
    "integrador solar",
  ],
  max_pages: 2,
};

/** Normaliza o jsonb (hoje vazio {}) para a forma tipada com defaults. */
export function parseReceitaConfig(json: unknown): ReceitaConfig {
  const j = (json ?? {}) as Partial<ReceitaConfig>;
  return {
    cnaes: Array.isArray(j.cnaes) ? j.cnaes : DEFAULT_RECEITA_CONFIG.cnaes,
    ufs: Array.isArray(j.ufs) ? j.ufs : DEFAULT_RECEITA_CONFIG.ufs,
    solar_gate:
      typeof j.solar_gate === "boolean"
        ? j.solar_gate
        : DEFAULT_RECEITA_CONFIG.solar_gate,
    volume_diario_max:
      typeof j.volume_diario_max === "number" && j.volume_diario_max > 0
        ? j.volume_diario_max
        : DEFAULT_RECEITA_CONFIG.volume_diario_max,
  };
}

export function parseMapsConfig(json: unknown): GoogleMapsConfig {
  const j = (json ?? {}) as Partial<GoogleMapsConfig>;
  return {
    cities: Array.isArray(j.cities) ? j.cities : DEFAULT_MAPS_CONFIG.cities,
    queries:
      Array.isArray(j.queries) && j.queries.length > 0
        ? j.queries
        : DEFAULT_MAPS_CONFIG.queries,
    max_pages:
      typeof j.max_pages === "number"
        ? Math.min(3, Math.max(1, j.max_pages))
        : DEFAULT_MAPS_CONFIG.max_pages,
  };
}

const CONFIG_KEY = ["captacao-config"];
const EXECUCOES_KEY = ["captacao-execucoes"];
const CAPTADOS_HOJE_KEY = ["captacao-captados-hoje"];

/** Linha id=1 de configuracoes_captacao. */
export function useCaptacaoConfig() {
  return useQuery({
    queryKey: CONFIG_KEY,
    queryFn: async (): Promise<CaptacaoRow | null> => {
      const { data, error } = await supabase
        .from("configuracoes_captacao")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Update parcial da linha id=1 com invalidate. */
export function useSalvarCaptacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: CaptacaoUpdate) => {
      const { error } = await supabase
        .from("configuracoes_captacao")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONFIG_KEY });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erro ao salvar configuração");
    },
  });
}

/** 5 últimas execuções (eventos_feed tipo='captacao'). */
export function useUltimaCaptacao() {
  return useQuery({
    queryKey: EXECUCOES_KEY,
    queryFn: async (): Promise<EventoFeed[]> => {
      const { data, error } = await supabase
        .from("eventos_feed")
        .select("*")
        .eq("tipo", "captacao")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Count (head) de leads criados hoje. */
export function useCaptadosHoje() {
  return useQuery({
    queryKey: CAPTADOS_HOJE_KEY,
    queryFn: async (): Promise<number> => {
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("criado_em", inicioHoje.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/**
 * Realtime da captação: INSERT em eventos_feed (filtrado client-side por
 * tipo='captacao') e INSERT em leads atualizam execuções e contador do dia.
 */
export function useCaptacaoRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("captacao-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "eventos_feed" },
        (payload) => {
          const novo = payload.new as EventoFeed;
          if (novo?.tipo === "captacao") {
            qc.invalidateQueries({ queryKey: EXECUCOES_KEY });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        () => {
          qc.invalidateQueries({ queryKey: CAPTADOS_HOJE_KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
