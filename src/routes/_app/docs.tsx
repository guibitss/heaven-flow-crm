import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/docs")({
  component: DocsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function DocsPage() {
  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-heaven-orange/15 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-heaven-orange" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arquitetura, manuais e FAQ do Heaven CRM
          </p>
        </div>
      </div>

      <Tabs defaultValue="arquitetura">
        <TabsList>
          <TabsTrigger value="arquitetura">Arquitetura</TabsTrigger>
          <TabsTrigger value="gestor">Manual do gestor</TabsTrigger>
          <TabsTrigger value="vendedor">Manual do vendedor</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="arquitetura" className="mt-4 bg-bg-secondary border border-border rounded-lg p-6 space-y-6">
          <Section title="Visão geral">
            <p>
              Heaven CRM é composto por frontend (TanStack Start + React), banco e
              autenticação no Supabase, e integrações externas (Google Maps,
              BrasilAPI, WAHA, Claude/IA Gateway, Bling).
            </p>
          </Section>
          <Section title="Módulos">
            <ul className="list-disc list-inside space-y-1">
              <li>Dashboard — KPIs, funil, ranking de velocidade.</li>
              <li>CRM/Kanban — gestão de leads, conversas e handoff.</li>
              <li>Captação — Google Maps, Receita Federal, blacklist.</li>
              <li>Agente IA — abordagem, qualificação, handoff, reativação.</li>
              <li>Relatórios — exportações PDF e CSV.</li>
              <li>LGPD — solicitações de titulares e consentimentos.</li>
            </ul>
          </Section>
          <Section title="Fluxo de dados (placeholder)">
            <p>Detalhar diagrama de captação → IA → handoff → vendedor → Bling.</p>
          </Section>
        </TabsContent>

        <TabsContent value="gestor" className="mt-4 bg-bg-secondary border border-border rounded-lg p-6 space-y-6">
          <Section title="Visão executiva">
            <p>Como acompanhar KPIs, ranking e taxa de qualificação no dashboard.</p>
          </Section>
          <Section title="Captação">
            <p>Configurar fontes Google Maps / Receita, raio, palavras-chave e blacklist.</p>
          </Section>
          <Section title="Agente IA">
            <p>Editar mensagem de abertura, perguntas de qualificação e regras de handoff.</p>
          </Section>
          <Section title="LGPD">
            <p>Como tratar solicitações de titulares e revogar consentimentos.</p>
          </Section>
        </TabsContent>

        <TabsContent value="vendedor" className="mt-4 bg-bg-secondary border border-border rounded-lg p-6 space-y-6">
          <Section title="Recebendo leads">
            <p>O lead chega já qualificado pela IA com tags e score. Verifique a aba Conversa.</p>
          </Section>
          <Section title="Respondendo rápido">
            <p>Meta: responder em até 30 minutos após o handoff para manter taxa de excelência.</p>
          </Section>
          <Section title="Atualizando o pipeline">
            <p>Mova o lead no Kanban conforme a etapa: abordado → respondeu → qualificado → negociação → ganho/perdido.</p>
          </Section>
        </TabsContent>

        <TabsContent value="faq" className="mt-4 bg-bg-secondary border border-border rounded-lg p-6 space-y-6">
          <Section title="Como reprocessar o score dos leads?">
            <p>Em Agente IA, use o botão "Reprocessar scores" no topo da página.</p>
          </Section>
          <Section title="Como adicionar um CNPJ à blacklist?">
            <p>Em Captação → aba Blacklist, adicione o CNPJ e o motivo.</p>
          </Section>
          <Section title="Como gerar um relatório?">
            <p>Em Relatórios, clique em "Gerar agora" para disparar a geração do PDF mensal.</p>
          </Section>
          <Section title="Onde vejo solicitações de LGPD?">
            <p>No menu lateral, item LGPD.</p>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
