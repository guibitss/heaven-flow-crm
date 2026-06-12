import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// DirtyStateBar — barra fixa inferior compartilhada pelos painéis de
// configuração (captação, IA, configurações, score). Aparece quando há
// alterações não salvas.

interface DirtyStateBarProps {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  label?: string;
}

export function DirtyStateBar({
  dirty,
  saving = false,
  onSave,
  onDiscard,
  label = "Alterações não salvas",
}: DirtyStateBarProps) {
  if (!dirty) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-strong bg-bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-bg-secondary/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <span className="label-xs flex items-center gap-2">
          <span className="inline-block size-1.5 rounded-full bg-heaven-orange" aria-hidden />
          {label}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
            Descartar
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
