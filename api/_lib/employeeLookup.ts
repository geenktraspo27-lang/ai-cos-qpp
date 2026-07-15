import { createUserScopedSupabaseClient } from './supabaseServer.js';

export interface CanonicalEmployee {
  id: string;
  name: string;
  roleJp: string;
  persona: string;
}

/**
 * Confirms `employeeId` genuinely belongs to the caller's company before
 * trusting anything the client said about who the employee is. Reuses the
 * app's existing RLS: the Supabase client is scoped with the caller's own
 * access token (never a service-role key), so `employee_state` — a
 * company_id-keyed table — only returns a row when this employee is part of
 * *this* company. A missing/expired token, an unknown employee id, or any
 * lookup error all resolve to null rather than throwing, so the caller can
 * fall back to the standard Workflow instead of failing the request.
 */
export async function lookupCompanyEmployee(
  accessToken: string,
  employeeId: string,
): Promise<CanonicalEmployee | null> {
  if (!employeeId) return null;
  const supabase = createUserScopedSupabaseClient(accessToken);
  if (!supabase) return null;

  try {
    const { data: stateRow } = await supabase
      .from('employee_state')
      .select('employee_id')
      .eq('employee_id', employeeId)
      .maybeSingle();
    if (!stateRow) return null;

    const { data: employeeRow } = await supabase
      .from('employees')
      .select('id, name, role_jp, persona')
      .eq('id', employeeId)
      .maybeSingle();
    if (!employeeRow) return null;

    return {
      id: employeeRow.id as string,
      name: employeeRow.name as string,
      roleJp: employeeRow.role_jp as string,
      persona: employeeRow.persona as string,
    };
  } catch {
    return null;
  }
}
