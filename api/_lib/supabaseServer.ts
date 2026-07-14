import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Builds a Supabase client scoped to the caller's own access token — never a
 * service-role key. Every query this client makes goes through the same RLS
 * policies the browser client uses, so it can only ever see/write this
 * user's own company's rows. Returns null if the URL/anon key aren't
 * configured or the token is empty, so callers can fail closed.
 */
export function createUserScopedSupabaseClient(accessToken: string): SupabaseClient | null {
  if (!accessToken) return null;

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Extracts the bearer token from an `Authorization: Bearer <token>` header. */
export function extractBearerToken(authHeader: string | undefined): string {
  return authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
}
