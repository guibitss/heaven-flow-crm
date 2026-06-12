import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/components/crm/crm-shared";

// Aba DADOS do dossiê: edição inline real (clique → input → blur/Enter salva).
// Campos calculados (score/porte/capital/cnae) são somente leitura.

const EDITAVEIS = [
  "telefone", "site",
  "decisor_nome", "decisor_cargo", "decisor_email", "decisor_telefone",
  "valor_estimado",
  "endereco_logradouro", "endereco_cidade", "endereco_uf", "endereco_cep",
] as const;

type CampoEditavel = (typeof EDITAVEIS)[number];

interface InlineFieldProps {
  leadId: string;
  campo: CampoEditavel;
  label: string;
  value: string | number | null;
  mono?: boolean;
  numeric?: boolean;
}

function InlineField({ leadId, campo, label, value, mono, numeric }: InlineFieldProps) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value == null ? "" : String(value));

  useEffect(() => {
    if (!editing) setDraft(value == null ? "" : String(value));
  }, [value, editing]);

  const salvar = useMutation({
    mutationFn: async (novo: string) => {
      const payload = numeric
        ? { [campo]: novo === "" ? null : Number(novo) }
        : { [campo]: novo.trim() === "" ? null : novo.trim() };
      const { error } = await supabase.from("leads").update(payload as never).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", leadId] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${label} atualizado`);
    },
    onError: (e: Error) => toast.error(e.message ?? `Erro ao salvar ${label}`),
  });

  function commit() {
    setEditing(false);
    const atual = value == null ? "" : String(value);
    if (draft === atual) return;
    salvar.mutate(draft);
  }

  return (
    <div>
      <div className="label-xs mb-1">{label}</div>
      {editing ? (
        <input
          autoFocus
          type={numeric ? "number" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(value == null ? "" : String(value)); setEditing(false); }
          }}
          className={cn(
            "h-8 w-full rounded-md border border-heaven-orange bg-bg-tertiary px-2 text-sm outline-none",
            (mono || numeric) && "font-mono tabular-nums",
          )}
          aria-label={`Editar ${label}`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "block w-full rounded-md px-2 py-1 -mx-2 text-left text-sm hover:bg-bg-tertiary transition-colors",
            (mono || numeric) && "font-mono tabular-nums",
            value == null || value === "" ? "text-muted-foreground" : "text-foreground",
          )}
          aria-label={`${label}: ${value ?? "vazio"}. Clique para editar`}
        >
          {campo === "valor_estimado" && typeof value === "number"
            ? formatBRL(value)
            : (value == null || value === "" ? "— clique para preencher" : String(value))}
        </button>
      )}
    </div>
  );
}

function ReadField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="label-xs mb-1">{label}</div>
      <div className={cn("text-sm px-2 -mx-2 py-1 text-foreground/90", mono && "font-mono tabular-nums")}>{value}</div>
    </div>
  );
}

export function DadosTab({ raw }: { raw: Record<string, unknown> }) {
  const id = raw.id as string;
  const v = (k: string) => (raw[k] ?? null) as string | number | null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <ReadField label="Razão social" value={String(raw.razao_social ?? "—")} />
      <ReadField label="CNPJ" value={String(raw.cnpj ?? "—")} mono />
      <InlineField leadId={id} campo="telefone" label="Telefone" value={v("telefone")} mono />
      <InlineField leadId={id} campo="site" label="Site" value={v("site")} />
      <ReadField label="CNAE" value={raw.cnae ? `${raw.cnae}${raw.cnae_descricao ? ` — ${raw.cnae_descricao}` : ""}` : "—"} />
      <ReadField label="Porte" value={String(raw.porte ?? "—")} />
      <ReadField label="Capital social" value={raw.capital_social != null ? formatBRL(Number(raw.capital_social)) : "—"} mono />
      <InlineField leadId={id} campo="valor_estimado" label="Valor estimado" value={v("valor_estimado")} numeric />

      <div className="md:col-span-2 border-t border-border pt-4 mt-1">
        <h3 className="label-xs mb-3">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <InlineField leadId={id} campo="endereco_logradouro" label="Logradouro" value={v("endereco_logradouro")} />
          <InlineField leadId={id} campo="endereco_cidade" label="Cidade" value={v("endereco_cidade")} />
          <InlineField leadId={id} campo="endereco_uf" label="UF" value={v("endereco_uf")} mono />
          <InlineField leadId={id} campo="endereco_cep" label="CEP" value={v("endereco_cep")} mono />
        </div>
      </div>

      <div className="md:col-span-2 border-t border-border pt-4 mt-1">
        <h3 className="label-xs mb-3">Decisor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <InlineField leadId={id} campo="decisor_nome" label="Nome" value={v("decisor_nome")} />
          <InlineField leadId={id} campo="decisor_cargo" label="Cargo" value={v("decisor_cargo")} />
          <InlineField leadId={id} campo="decisor_telefone" label="Telefone" value={v("decisor_telefone")} mono />
          <InlineField leadId={id} campo="decisor_email" label="E-mail" value={v("decisor_email")} />
        </div>
      </div>
    </div>
  );
}
