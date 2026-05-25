import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(242,127,27,0.15), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-[400px] bg-bg-secondary border border-border rounded-lg p-8 glow-orange">
        <div className="flex justify-center mb-8">
          <img src="/heaven-logo.png" alt="Heaven" className="h-24 w-auto object-contain" />
        </div>
        <h2 className="text-2xl font-semibold text-center mb-6">Acessar a plataforma</h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
        >
          <div>
            <label className="label-xs block mb-2">Email</label>
            <input
              type="email"
              defaultValue="gestor@heaven.com.br"
              className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border focus:border-heaven-orange focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="label-xs block mb-2">Senha</label>
            <input
              type="password"
              defaultValue="••••••••"
              className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border focus:border-heaven-orange focus:outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full h-11 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium transition-all glow-orange"
          >
            Entrar
          </button>
          <Link to="/dashboard" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            Esqueci minha senha
          </Link>
        </form>
      </div>
    </div>
  );
}
