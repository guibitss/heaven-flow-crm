import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app")({
  component: AppGuard,
});

function AppGuard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading) {
    // Esqueleto discreto do shell enquanto a sessão é verificada.
    return (
      <div className="min-h-screen bg-background flex" aria-busy="true" aria-label="Carregando">
        <div className="hidden md:flex w-64 flex-col border-r border-border p-4 gap-3">
          <Skeleton className="h-10 w-28 shimmer-heaven" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full shimmer-heaven" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-border flex items-center px-6 gap-4">
            <Skeleton className="h-9 w-full max-w-md mx-auto shimmer-heaven" />
            <Skeleton className="h-9 w-9 rounded-full shimmer-heaven" />
          </div>
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-48 shimmer-heaven" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full shimmer-heaven" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return <AppShell><Outlet /></AppShell>;
}
