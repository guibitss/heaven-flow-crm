import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmberField } from "@/components/effects/ember-field";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  // "A usina liga, depois o painel acende": card faz fade-in com delay 150ms.
  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  function shakeCard() {
    if (reduced || !cardRef.current) return;
    cardRef.current.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(4px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 320, easing: "ease-in-out" },
    );
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Informe seu email para redefinir a senha.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error(error.message ?? "Erro ao enviar email de redefinição.");
    else toast.success("Email de redefinição enviado. Verifique sua caixa de entrada.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setCredError(null);
    try {
      if (mode === "signup") {
        // Solicitação de acesso: SEM role no metadata — perfis/roles são
        // definidos pelo gestor (cadastro aberto não pode virar gestor).
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { nome: email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Solicitação enviada! Aguarde a liberação do acesso.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setCredError("Email ou senha incorretos.");
          shakeCard();
          return;
        }
        // Login ok: fagulhas apagam (300ms) e navega.
        setLeaving(true);
        if (reduced) {
          navigate({ to: "/dashboard" });
        } else {
          setTimeout(() => navigate({ to: "/dashboard" }), 300);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Brasa na base — a fonte de energia fica embaixo, fagulhas sobem */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(242,127,27,0.16), transparent 55%)" }}
      />
      <EmberField fadeOut={leaving} />

      <div
        ref={cardRef}
        className="relative w-full max-w-[400px] bg-bg-secondary border border-border rounded-lg p-8 energized-top glow-orange transition-opacity duration-500"
        style={{ opacity: cardVisible ? 1 : 0 }}
      >
        <div className="flex justify-center mb-8">
          <img src="/heaven-logo.png" alt="Heaven" className="h-24 w-auto object-contain" />
        </div>
        <h2 className="text-2xl font-semibold text-center mb-6">
          {mode === "signin" ? "Acessar a plataforma" : "Solicitar acesso"}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login-email" className="label-xs block mb-2">Email</label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border focus:border-heaven-orange focus:outline-none text-sm"
            />
          </div>
          <div>
            <label htmlFor="login-senha" className="label-xs block mb-2">Senha</label>
            <input
              id="login-senha"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border focus:border-heaven-orange focus:outline-none text-sm"
            />
          </div>

          {credError && (
            <p role="alert" className="text-sm text-destructive">
              {credError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || leaving}
            className="w-full h-11 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium transition-all glow-orange disabled:opacity-50"
          >
            {loading ? "Entrando..." : mode === "signin" ? "Entrar" : "Solicitar acesso"}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Esqueci a senha
            </button>
          )}
          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setCredError(null); }}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Não tem conta? Solicitar acesso" : "Já tenho conta"}
          </button>
        </form>

        <p className="mt-8 text-center font-mono text-[10px] tracking-widest text-muted-foreground/60">
          HEAVEN FLOW v2.0
        </p>
      </div>
    </div>
  );
}
