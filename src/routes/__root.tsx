import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";

import appCss from "../styles.css?url";

// Fagulha estática — único acento de cor nas telas de erro.
function FagulhaSvg() {
  return (
    <svg
      className="mx-auto mb-2 text-heaven-orange"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="14" r="3" fill="currentColor" />
      <circle cx="12" cy="14" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
      <circle cx="17" cy="7" r="1.2" fill="currentColor" opacity="0.6" />
      <circle cx="7" cy="9" r="0.8" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <FagulhaSvg />
        <h1 className="font-mono text-[96px] leading-none font-bold text-bg-tertiary select-none">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-heaven-orange px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-heaven-orange-deep"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <FagulhaSvg />
        <h1 className="font-mono text-[96px] leading-none font-bold text-bg-tertiary select-none">500</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Algo deu errado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte ao dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-heaven-orange px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-heaven-orange-deep"
          >
            Tentar novamente
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-tertiary"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Heaven CRM" },
      { name: "description", content: "CRM e Dashboard Heaven — Estruturas para painéis fotovoltaicos" },
      { name: "theme-color", content: "#0D0D0D" },
      { property: "og:title", content: "Heaven CRM" },
      { name: "twitter:title", content: "Heaven CRM" },
      { property: "og:description", content: "CRM e Dashboard Heaven — Estruturas para painéis fotovoltaicos" },
      { name: "twitter:description", content: "CRM e Dashboard Heaven — Estruturas para painéis fotovoltaicos" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
