import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { nome: email.split("@")[0], role: "gestor" },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(242,127,27,0.15), transparent 60%)" }} />
      <div className="relative w-full max-w-[400px] bg-bg-secondary border border-border rounded-lg p-8 glow-orange">
        <div className="flex justify-center mb-8">
          <img src="/heaven-logo.png" alt="Heaven" className="h-24 w-auto object-contain" />
        </div>
        <h2 className="text-2xl font-semibold text-center mb-6">
          {mode === "signin" ? "Acessar a plataforma" : "Criar conta"}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label-xs block mb-2">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border focus:border-heaven-orange focus:outline-none text-sm" />
          </div>
          <div>
            <label className="label-xs block mb-2">Senha</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border focus:border-heaven-orange focus:outline-none text-sm" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium transition-all glow-orange disabled:opacity-50">
            {loading ? "..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "Não tem conta? Criar uma" : "Já tenho conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
