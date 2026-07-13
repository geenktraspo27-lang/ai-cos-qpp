import { supabase } from './supabase';

/** Sign-up metadata read by the `handle_new_user` DB trigger, which creates
 * the company + founder profile and seeds starter data (see supabase/migrations). */
export async function signUp(email: string, password: string, companyName: string, displayName: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { company_name: companyName, display_name: displayName } },
  });
  if (error) throw error;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
