import { Session, User } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function ensureUserProfile(user: User) {
  // Keep a matching row in our public users table for joins and ownership checks.
  await supabase.from('users').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stillMounted = true;

    const hydrateSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!stillMounted) return;

      setSession(data.session);

      if (data.session?.user) {
        await ensureUserProfile(data.session.user);
      }

      if (stillMounted) {
        setLoading(false);
      }
    };

    hydrateSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!stillMounted) return;

      // This keeps tabs/layout in sync right after sign-in/sign-out.
      setSession(nextSession);

      if (nextSession?.user) {
        await ensureUserProfile(nextSession.user);
      }
    });

    return () => {
      stillMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (!error && data.user) {
          await ensureUserProfile(data.user);
        }
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
