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
    <div className="space-y-6 max-w-[1100px] mx-auto w-full overflow-x-hidden">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-heaven-orange/15 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-heaven-orange" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manuais e FAQ do Heaven CRM
          </p>
        </div>
      </div>

      <Tabs defaultValue="arquitetura" className="w-full">
        <div className="w-full overflow-x-auto -mx-1 px-1">
          <TabsList className="w-max sm:w-auto flex sm:inline-flex">
            <TabsTrigger value="arquitetura">Arquitetura</TabsTrigger>
            <TabsTrigger value="gestor">Manual do gestor</TabsTrigger>
            <TabsTrigger value="vendedor">Manual do vendedor</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="arquitetura" className="mt-4 bg-bg-secondary border border-border rounded-lg p-4 sm:p-6 space-y-6">
          <Section title="Como o Heaven CRM funciona">
            <ol className="list-decimal list-inside space-y-1">
              <li>Captação automática de empresas</li>
              <li>Qualificação por IA</li>
              <li>Distribuição para vendedores</li>
              <li>Atendimento e negociação</li>
              <li>Gestão comercial</li>
              <li>Relatórios e acompanhamento</li>
            </ol>
          </Section>
          <Section title="Fluxo operacional">
            <p className="break-words">
              Captação → Qualificação → Distribuição → Atendimento → Negociação → Fechamento
            </p>
          </Section>
        </TabsContent>

        <TabsContent value="gestor" className="mt-4 bg-bg-secondary border border-border rounded-lg p-4 sm:p-6 space-y-6">
          <Section title="Dashboard">
            <ul className="list-disc list-inside space-y-1">
              <li>Acompanhar KPIs</li>
              <li>Conversão da equipe</li>
              <li>Tempo de resposta</li>
              <li>Ranking de vendedores</li>
            </ul>
          </Section>
          <Section title="Captação">
            <ul className="list-disc list-inside space-y-1">
              <li>Configurar cidades</li>
              <li>Configurar segmentos</li>
              <li>Configurar blacklist</li>
            </ul>
          </Section>
          <Section title="Relatórios">
            <ul className="list-disc list-inside space-y-1">
              <li>Exportar PDF</li>
              <li>Exportar CSV</li>
              <li>Acompanhar resultados</li>
            </ul>
          </Section>
          <Section title="Equipe">
            <ul className="list-disc list-inside space-y-1">
              <li>Ativar vendedores</li>
              <li>Pausar vendedores</li>
              <li>Acompanhar desempenho</li>
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="vendedor" className="mt-4 bg-bg-secondary border border-border rounded-lg p-4 sm:p-6 space-y-6">
          <Section title="Recebendo Leads">
            <p>O sistema entrega empresas previamente qualificadas.</p>
          </Section>
          <Section title="Primeiro Contato">
            <p>Responder rapidamente aumenta a chance de conversão.</p>
          </Section>
          <Section title="Atualizando CRM">
            <p>Mover o lead conforme o avanço da negociação.</p>
          </Section>
          <Section title="Acompanhamento">
            <p>Registrar observações e histórico comercial.</p>
          </Section>
        </TabsContent>

        <TabsContent value="faq" className="mt-4 bg-bg-secondary border border-border rounded-lg p-4 sm:p-6 space-y-6">
          <Section title="Como os leads são captados?">
            <p>Através das fontes configuradas pelo gestor.</p>
          </Section>
          <Section title="A IA conversa sozinha?">
            <p>A IA realiza a abordagem inicial e transfere para um vendedor quando identifica oportunidade.</p>
          </Section>
          <Section title="Posso exportar relatórios?">
            <p>Sim, em PDF e CSV.</p>
          </Section>
          <Section title="Posso acompanhar minha equipe?">
            <p>Sim. O sistema possui métricas individuais e consolidadas.</p>
          </Section>
          <Section title="Como funciona a blacklist?">
            <p>Empresas bloqueadas deixam de participar dos processos de captação.</p>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
