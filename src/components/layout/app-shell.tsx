import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Radar,
  Bot,
  BarChart3,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  Shield,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PulseFlash } from "@/components/common/pulse-flash";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/crm", label: "CRM", icon: KanbanSquare },
  { to: "/vendedores", label: "Vendedores", icon: Users },
  { to: "/captacao", label: "Captação", icon: Radar },
  { to: "/ia", label: "Agente IA", icon: Bot },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/lgpd", label: "LGPD", icon: Shield },
  { to: "/docs", label: "Documentação", icon: BookOpen },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const COLLAPSE_KEY = "heaven-sidebar-collapsed";

type LeadHit = { id: string; razao_social: string; cnpj: string | null };
type VendedorHit = { id: string; nome: string };
type FeedEvento = { id: string; tipo: string; texto: string; created_at: string };

function iniciais(nome?: string | null, email?: string | null): string {
  const base = nome?.trim() || email?.split("@")[0] || "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmd((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login" });
  }

  // Breadcrumb estilo path: heaven / crm / ...
  const segments = path.split("/").filter(Boolean);
  const breadcrumb = ["heaven", ...segments].join(" / ");

  const nome = profile?.nome || user?.email?.split("@")[0] || "Usuário";
  const email = profile?.email || user?.email || "";
  const avatarUrl = profile?.avatar_url ?? undefined;

  return (
    <div className="min-h-screen grain-bg flex">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar fixed inset-y-0 left-0 z-30 transition-[width] duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent
          path={path}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          nome={nome}
          email={email}
          avatarUrl={avatarUrl}
        />
      </aside>

      {/* Sidebar mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border md:hidden animate-in slide-in-from-left">
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute top-4 right-4 text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent path={path} collapsed={false} nome={nome} email={email} avatarUrl={avatarUrl} />
          </aside>
        </>
      )}

      <div className={cn("flex-1 flex flex-col min-w-0 transition-[padding] duration-200", collapsed ? "md:pl-16" : "md:pl-64")}>
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background/60 backdrop-blur sticky top-0 z-20 flex items-center px-4 md:px-6 gap-4">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="md:hidden text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block font-mono text-xs text-muted-foreground truncate" aria-label="Localização atual">
            {breadcrumb}
          </div>
          <div className="flex-1 max-w-md mx-auto">
            <button
              onClick={() => setCmd(true)}
              className="w-full flex items-center gap-2 px-3 h-9 rounded-md bg-bg-secondary border border-border text-sm text-muted-foreground hover:border-border-strong transition-colors"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Buscar leads, vendedores...</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary border border-border font-mono">⌘K</kbd>
            </button>
          </div>

          <NotificacoesBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Menu do usuário" className="rounded-full">
                <Avatar className="h-9 w-9 border border-border-strong">
                  <AvatarImage src={avatarUrl} alt="" />
                  <AvatarFallback className="bg-bg-tertiary text-xs font-medium">
                    {iniciais(profile?.nome, email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="truncate">{nome}</span>
                  <span className="text-xs font-normal text-muted-foreground truncate">{email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/configuracoes">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      <BuscaGlobal open={cmd} onOpenChange={setCmd} />
    </div>
  );
}

/* ---------------- Busca global (⌘K) — Supabase real ---------------- */

function BuscaGlobal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<LeadHit[]>([]);
  const [vendedores, setVendedores] = useState<VendedorHit[]>([]);
  const [searching, setSearching] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (!open) { setQuery(""); setLeads([]); setVendedores([]); }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setLeads([]);
      setVendedores([]);
      return;
    }
    const id = ++reqId.current;
    setSearching(true);
    const t = setTimeout(async () => {
      const term = query.trim().replace(/[%_]/g, "");
      const pattern = `%${term}%`;
      const [leadsRes, vendRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id,razao_social,cnpj")
          .or(`razao_social.ilike.${pattern},cnpj.ilike.${pattern}`)
          .limit(8),
        supabase.from("profiles").select("id,nome").ilike("nome", pattern).limit(5),
      ]);
      if (id !== reqId.current) return; // resposta antiga, descarta
      setLeads((leadsRes.data as LeadHit[] | null) ?? []);
      setVendedores((vendRes.data as VendedorHit[] | null) ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function go(fn: () => void) {
    onOpenChange(false);
    fn();
  }

  const hasResults = leads.length > 0 || vendedores.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Busca global</DialogTitle>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3">
          <CommandInput
            placeholder="Buscar lead (razão social, CNPJ) ou vendedor..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!hasResults && (
              <CommandEmpty>
                {query.trim().length < 2
                  ? "Digite ao menos 2 caracteres."
                  : searching
                    ? "Buscando..."
                    : "Nenhum resultado."}
              </CommandEmpty>
            )}
            {leads.length > 0 && (
              <CommandGroup heading="Leads">
                {leads.map((l) => (
                  <CommandItem
                    key={l.id}
                    value={`lead-${l.id}`}
                    onSelect={() => go(() => navigate({ to: "/crm/$id", params: { id: l.id } }))}
                  >
                    <div className="flex flex-col">
                      <span>{l.razao_social}</span>
                      {l.cnpj && <span className="text-xs font-mono text-muted-foreground">{l.cnpj}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {vendedores.length > 0 && (
              <CommandGroup heading="Vendedores">
                {vendedores.map((v) => (
                  <CommandItem
                    key={v.id}
                    value={`vend-${v.id}`}
                    onSelect={() => go(() => navigate({ to: "/vendedores/$id", params: { id: v.id } }))}
                  >
                    {v.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Sino de notificações — realtime eventos_feed ---------------- */

function NotificacoesBell() {
  const [eventos, setEventos] = useState<FeedEvento[]>([]);
  const [naoLidos, setNaoLidos] = useState(0);

  useEffect(() => {
    let mounted = true;

    supabase
      .from("eventos_feed")
      .select("id,tipo,texto,created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }: { data: unknown }) => {
        if (mounted && data) setEventos(data as FeedEvento[]);
      });

    const channel = supabase
      .channel("bell-eventos-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "eventos_feed" },
        (payload: { new: FeedEvento }) => {
          setEventos((prev) => [payload.new, ...prev].slice(0, 10));
          setNaoLidos((n) => n + 1);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <DropdownMenu onOpenChange={(o) => { if (o) setNaoLidos(0); }}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={naoLidos > 0 ? `Notificações: ${naoLidos} não lidas` : "Notificações"}
          className="relative p-2 rounded-md hover:bg-bg-tertiary transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          {naoLidos > 0 && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-heaven-orange" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {eventos.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhum evento por enquanto.
          </div>
        ) : (
          <PulseFlash pulseKey={eventos[0]?.id ?? "vazio"}>
            <div className="max-h-80 overflow-y-auto">
              {eventos.map((ev) => (
                <div key={ev.id} className="px-3 py-2 border-b border-border last:border-0">
                  <p className="text-sm leading-snug">{ev.texto}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(ev.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </PulseFlash>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------- Sidebar ---------------- */

function SidebarContent({
  path,
  collapsed,
  onToggle,
  nome,
  email,
  avatarUrl,
}: {
  path: string;
  collapsed: boolean;
  onToggle?: () => void;
  nome: string;
  email: string;
  avatarUrl?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full">
        <div className={cn("h-20 flex items-center border-b border-border", collapsed ? "justify-center px-2" : "px-6")}>
          <img
            src="/heaven-logo.png"
            alt="Heaven"
            className={cn("w-auto object-contain", collapsed ? "h-8" : "h-10")}
          />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
            const Icon = item.icon;
            const link = (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 h-10 rounded-md text-sm transition-colors duration-150",
                  collapsed ? "justify-center px-0" : "px-3",
                  active
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-heaven-orange" aria-hidden="true" />
                )}
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-heaven-orange" : "")} aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
            if (!collapsed) return link;
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {onToggle && (
          <div className={cn("p-3 hairline-top", collapsed && "flex justify-center")}>
            <button
              onClick={onToggle}
              aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              className="flex items-center gap-2 h-8 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-bg-tertiary transition-colors text-xs w-full justify-center"
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" aria-hidden="true" /> : (
                <>
                  <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                  Recolher
                </>
              )}
            </button>
          </div>
        )}

        <div className="p-3 border-t border-border">
          <div className={cn("flex items-center gap-3 py-2 rounded-md", collapsed ? "justify-center px-0" : "px-2")}>
            <Avatar className="h-8 w-8 border border-border-strong">
              <AvatarImage src={avatarUrl} alt="" />
              <AvatarFallback className="bg-bg-tertiary text-[10px] font-medium">
                {iniciais(nome, email)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{nome}</div>
                <div className="text-xs text-muted-foreground truncate">{email}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
