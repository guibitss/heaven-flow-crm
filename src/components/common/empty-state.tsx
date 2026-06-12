import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// EmptyState editorial — estado vazio honesto ("forja fria"). Sem laranja
// ambiente: cinza, tipografia, e um único CTA quando fizer sentido.

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-8 py-14 text-center",
        className,
      )}
    >
      {Icon && <Icon className="mb-1 size-7 text-heaven-gray" aria-hidden />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
