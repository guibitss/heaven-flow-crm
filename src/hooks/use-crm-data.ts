import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ====== KPIs ======
export function useDashboardKpis(periodoDias = 30) {
  return useQuery({
    queryKey: ["dashboard-kpis", periodoDias],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_kpis", { periodo_dias: periodoDias });
      if (error) throw error;
      return data as {
        leads_captados: number;
        leads_captados_anterior: number;
        taxa_resposta: number | null;
        taxa_qualificacao: number | null;
        conversao_final: number | null;
        ticket_medio: number | null;
        tempo_medio_resposta_segundos: number | null;
        tempo_medio_resposta_anterior: number | null;
      };
    },
    refetchInterval: 60000,
  });
}

// ====== Funil ======
export function useFunil(periodoDias = 30) {
  return useQuery({
    queryKey: ["funil", periodoDias],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_funil_data", { periodo_dias: periodoDias });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ====== Leads ======
export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, vendedor:profiles(id,nome,avatar_url)")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLeadDetail(id: string) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, vendedor:profiles(id,nome,avatar_url), mensagens(*), notas(*, autor:profiles(id,nome,avatar_url)), anexos(*), lead_tags(tag:tags(*))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      qc.invalidateQueries({ queryKey: ["funil"] });
      qc.invalidateQueries({ queryKey: ["ranking-velocidade"] });
      qc.invalidateQueries({ queryKey: ["leads-aguardando"] });
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });
}

// ====== Vendedores ======
export function useVendedores() {
  return useQuery({
    queryKey: ["vendedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["vendedor", "gestor"])
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useVendedor(id: string) {
  return useQuery({
    queryKey: ["vendedor", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// ====== Live feed (realtime) ======
type EventoFeed = {
  id: string;
  tipo: string;
  texto: string;
  created_at: string;
  lead_id: string | null;
  vendedor_id: string | null;
};

export function useLiveFeed() {
  const [eventos, setEventos] = useState<EventoFeed[]>([]);
  useEffect(() => {
    supabase.from("eventos_feed").select("*").order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => setEventos((data as EventoFeed[]) ?? []));

    const channel = supabase.channel("eventos-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "eventos_feed" },
        (payload) => setEventos((prev) => [payload.new as EventoFeed, ...prev].slice(0, 30)))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
  return eventos;
}

// ====== Tempo de resposta ======
export function useRankingVelocidade(periodoDias = 30) {
  return useQuery({
    queryKey: ["ranking-velocidade", periodoDias],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ranking_velocidade_vendedores", { periodo_dias: periodoDias });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000,
  });
}

export function useLeadsAguardando() {
  return useQuery({
    queryKey: ["leads-aguardando"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leads_aguardando_resposta");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });
}

// ====== Realtime leads invalidator ======
export function useLeadsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase.channel("leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads"] });
        qc.invalidateQueries({ queryKey: ["leads-aguardando"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
}
