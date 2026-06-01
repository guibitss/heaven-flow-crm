import { Link, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { leads } from "@/lib/mock-data";

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [query, setQuery] = useState("");

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

  const breadcrumb = navItems.find((n) => path.startsWith(n.to))?.label ?? "Heaven";
  const results = query.length > 1
    ? leads.filter((l) =>
        l.razao_social.toLowerCase().includes(query.toLowerCase()) ||
        l.cnpj.includes(query),
      ).slice(0, 8)
    : [];

  return (
    <div className="min-h-screen grain-bg flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar fixed inset-y-0 left-0 z-30">
        <SidebarContent path={path} />
      </aside>

      {/* Sidebar mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border md:hidden animate-in slide-in-from-left">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent path={path} />
          </aside>
        </>
      )}

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background/60 backdrop-blur sticky top-0 z-20 flex items-center px-4 md:px-6 gap-4">
          <button onClick={() => setOpen(true)} className="md:hidden text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm text-muted-foreground hidden md:block">
            <span className="text-foreground font-medium">{breadcrumb}</span>
          </div>
          <div className="flex-1 max-w-md mx-auto">
            <button
              onClick={() => setCmd(true)}
              className="w-full flex items-center gap-2 px-3 h-9 rounded-md bg-bg-secondary border border-border text-sm text-muted-foreground hover:border-border-strong transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Buscar leads, vendedores...</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary border border-border font-mono">⌘K</kbd>
            </button>
          </div>
          <button className="relative p-2 rounded-md hover:bg-bg-tertiary transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-heaven-orange" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-bg-tertiary border border-border-strong overflow-hidden">
                <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=admin&backgroundColor=232323" alt="" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Admin Heaven</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/login">Sair</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      <CommandDialog open={cmd} onOpenChange={setCmd}>
        <CommandInput placeholder="Buscar lead por razão social ou CNPJ..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>Nenhum resultado.</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Leads">
              {results.map((l) => (
                <CommandItem key={l.id} value={l.razao_social} onSelect={() => { setCmd(false); window.location.href = `/crm/${l.id}`; }}>
                  <div className="flex flex-col">
                    <span>{l.razao_social}</span>
                    <span className="text-xs font-mono text-muted-foreground">{l.cnpj}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}

function SidebarContent({ path }: { path: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-20 flex items-center px-6 border-b border-border">
        <img src="/heaven-logo.png" alt="Heaven" className="h-10 w-auto object-contain" />
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-all duration-150 border-l-[3px]",
                active
                  ? "bg-bg-tertiary text-foreground border-heaven-orange"
                  : "text-muted-foreground hover:bg-bg-tertiary hover:text-foreground border-transparent",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-heaven-orange" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md">
          <div className="h-8 w-8 rounded-full bg-bg-tertiary border border-border-strong overflow-hidden">
            <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=admin&backgroundColor=232323" alt="" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Admin Heaven</div>
            <div className="text-xs text-muted-foreground truncate">gestor@heaven.com.br</div>
          </div>
        </div>
      </div>
    </div>
  );
}
