import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfigPage,
});

type User = { nome: string; email: string; perfil: string; status: string };

const initialUsers: User[] = [
  { nome: "Admin Heaven", email: "admin@heaven.com.br", perfil: "Admin", status: "Ativo" },
  { nome: "Carlos Silva", email: "carlos@heaven.com.br", perfil: "Vendedor", status: "Ativo" },
  { nome: "José Almeida", email: "jose@heaven.com.br", perfil: "Vendedor", status: "Ativo" },
  { nome: "Mariana Costa", email: "mariana@heaven.com.br", perfil: "Gestor", status: "Ativo" },
];

const perfilCor: Record<string, string> = {
  Admin: "bg-heaven-orange/20 text-heaven-orange",
  Gestor: "bg-info/20 text-info",
  Vendedor: "bg-bg-tertiary text-muted-foreground",
};

const integracoes = [
  { nome: "Bling ERP", status: "conectado", desc: "Último sync: há 12 min" },
  { nome: "WAHA (WhatsApp)", status: "conectado", desc: "Sessão ativa: heaven-comercial" },
  { nome: "Meta Ads", status: "desconectado", desc: "Em breve" },
];

function ConfigPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<User>({ nome: "", email: "", perfil: "Vendedor", status: "Ativo" });

  const handleSave = () => {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Preencha nome e email.");
      return;
    }
    setUsers((prev) => [...prev, form]);
    setOpen(false);
    setForm({ nome: "", email: "", perfil: "Vendedor", status: "Ativo" });
    toast.success("Usuário adicionado para demonstração.");
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="notif">Notificações</TabsTrigger>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 w-full max-w-full overflow-hidden">
          <div className="flex justify-end mb-4">
            <button onClick={() => setOpen(true)} className="h-9 px-3 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium flex items-center gap-1.5"><Plus className="h-4 w-4" /> Adicionar usuário</button>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((u) => (
              <div key={u.email} className="w-full max-w-full overflow-hidden bg-bg-tertiary/40 border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm break-words">{u.nome}</span>
                  <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${perfilCor[u.perfil]}`}>{u.perfil}</span>
                </div>
                <div className="font-mono text-xs text-muted-foreground break-all">{u.email}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-success">●  {u.status}</span>
                  <button className="text-xs text-muted-foreground hover:text-foreground">Editar</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <table className="w-full text-sm hidden md:table">
            <thead className="text-xs label-xs"><tr><th className="text-left pb-3">Nome</th><th className="text-left pb-3">Email</th><th className="text-left pb-3">Perfil</th><th className="text-left pb-3">Status</th><th></th></tr></thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.email}>
                  <td className="py-3">{u.nome}</td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{u.email}</td>
                  <td className="py-3"><span className={`text-xs px-2 py-1 rounded ${perfilCor[u.perfil]}`}>{u.perfil}</span></td>
                  <td className="py-3"><span className="text-xs text-success">●  {u.status}</span></td>
                  <td className="py-3 text-right text-xs text-muted-foreground"><button className="hover:text-foreground">Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-muted-foreground mt-4">Cadastro real com acesso será conectado na implantação.</p>
        </TabsContent>


        <TabsContent value="integracoes" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {integracoes.map((i) => (
            <div key={i.nome} className="bg-bg-secondary border border-border rounded-lg p-5">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold">{i.nome}</h4>
                <span className={`text-xs px-2 py-0.5 rounded ${i.status === "conectado" ? "bg-success/15 text-success" : "bg-bg-tertiary text-muted-foreground"}`}>
                  {i.status === "conectado" ? "Conectado" : "Desconectado"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{i.desc}</p>
              <button className="h-9 px-3 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm w-full">{i.status === "conectado" ? "Reconectar" : "Conectar"}</button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="notif" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-4 max-w-2xl">
          {["Novo lead captado","Handoff IA → Vendedor","Venda fechada","Alerta de inatividade","Resumo diário por email"].map((n) => (
            <div key={n} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <span className="text-sm">{n}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="empresa" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-4 max-w-xl">
          <div>
            <label className="label-xs block mb-2">Nome da empresa</label>
            <input defaultValue="Heaven Estruturas Solares" className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border text-sm" />
          </div>
          <div>
            <label className="label-xs block mb-2">CNPJ</label>
            <input defaultValue="00.000.000/0001-00" className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border text-sm font-mono" />
          </div>
          <div>
            <label className="label-xs block mb-2">Fuso horário</label>
            <input defaultValue="America/Sao_Paulo" className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border text-sm" />
          </div>
          <div>
            <label className="label-xs block mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-32 rounded bg-bg-tertiary border border-border flex items-center justify-center p-2">
                <img src="/heaven-logo.png" alt="" className="max-h-full max-w-full object-contain" />
              </div>
              <button className="h-9 px-3 rounded-md bg-bg-tertiary text-sm">Alterar logo</button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
