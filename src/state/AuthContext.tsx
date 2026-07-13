import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  companyId: string;
  companyName: string;
  displayName: string;
  role: 'founder' | 'member';
}

interface AuthApi {
  session: Session | null;
  profile: Profile | null;
  /** True while resolving the initial session/profile on load. */
  loading: boolean;
}

const AuthCtx = createContext<AuthApi | null>(null);

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id, company_id, display_name, role')
    .eq('id', userId)
    .single();
  if (profileError || !profileRow) return null;

  const { data: companyRow } = await supabase
    .from('companies')
    .select('name')
    .eq('id', profileRow.company_id)
    .single();

  return {
    id: profileRow.id,
    companyId: profileRow.company_id,
    companyName: companyRow?.name ?? '',
    displayName: profileRow.display_name,
    role: profileRow.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) setProfile(await loadProfile(data.session.user.id));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setProfile(await loadProfile(nextSession.user.id));
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthCtx.Provider value={{ session, profile, loading }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
