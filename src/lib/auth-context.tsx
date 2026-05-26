import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  cargo: string | null;
  role: "vendedor" | "gestor" | "admin";
  status: "ativo" | "pausado";
  regiao: string | null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, profile: null, loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: string, s: Session | null) => {
      setSession(s);
      if (s?.user) {
        // defer profile fetch
        setTimeout(() => {
          supabase.from("profiles").select("id,nome,email,avatar_url,cargo,role,status,regiao")
            .eq("id", s.user.id).maybeSingle()
            .then(({ data }: { data: unknown }) => setProfile(data as Profile | null));
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      if (data.session?.user) {
        supabase.from("profiles").select("id,nome,email,avatar_url,cargo,role,status,regiao")
          .eq("id", data.session.user.id).maybeSingle()
          .then(({ data: p }: { data: unknown }) => { setProfile(p as Profile | null); setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session, profile, loading,
      signOut: async () => { await supabase.auth.signOut(); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
