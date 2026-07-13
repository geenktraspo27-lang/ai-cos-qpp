-- Row-level security: every company-scoped table is only readable/writable by
-- an authenticated user whose profile belongs to that company.

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'founder'
  )
$$;

-- companies: members can read their own company; only founders can update it.
alter table public.companies enable row level security;

create policy companies_select on public.companies
  for select using (id = public.current_company_id());

create policy companies_update on public.companies
  for update using (id = public.current_company_id() and public.is_founder());

-- profiles: members can read/update their own row and see teammates in the same company.
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select using (company_id = public.current_company_id());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- employees: fixed shared reference data, world-readable, not writable via the API.
alter table public.employees enable row level security;

create policy employees_select on public.employees
  for select using (true);

-- Generic pattern applied to every company-scoped table below:
--   SELECT/INSERT/UPDATE/DELETE allowed only when company_id = current_company_id().
-- Founder-only write restrictions (e.g. editing Vision/Goals/KPIs, approving
-- decisions) are enforced at this MVP stage by allowing any company member to
-- write; tighten to `and public.is_founder()` once multi-member roles matter.

do $$
declare
  t text;
  company_scoped_tables text[] := array[
    'employee_state', 'tasks', 'goals', 'kpis', 'decisions',
    'workflows', 'ideas', 'finance_summary', 'finance_kpis', 'finance_costs',
    'contracts', 'brand_kpis', 'campaigns', 'market_insights',
    'documentation_summary', 'documents', 'notifications', 'activity_feed',
    'subscriptions'
  ];
begin
  foreach t in array company_scoped_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id())',
      t || '_company_scoped', t
    );
  end loop;
end $$;

-- company_vision uses company_id as its primary key, same pattern.
alter table public.company_vision enable row level security;

create policy company_vision_scoped on public.company_vision
  for all using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- decision_messages / decision_contributors are scoped via their parent decision.
alter table public.decision_messages enable row level security;

create policy decision_messages_scoped on public.decision_messages
  for all using (
    decision_id in (select id from public.decisions where company_id = public.current_company_id())
  )
  with check (
    decision_id in (select id from public.decisions where company_id = public.current_company_id())
  );

alter table public.decision_contributors enable row level security;

create policy decision_contributors_scoped on public.decision_contributors
  for all using (
    decision_id in (select id from public.decisions where company_id = public.current_company_id())
  )
  with check (
    decision_id in (select id from public.decisions where company_id = public.current_company_id())
  );
