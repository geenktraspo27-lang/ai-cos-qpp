-- AI-COS core schema: multi-tenant (per-company) data model.
-- The 8-employee roster (public.employees) is fixed, shared reference data —
-- README §4/§5: "変更不可" (character roster must not change).
-- Everything else is scoped by company_id (one company = one tenant).

create extension if not exists pgcrypto;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  display_name text not null,
  role text not null default 'founder' check (role in ('founder', 'member')),
  created_at timestamptz not null default now()
);

create index profiles_company_id_idx on public.profiles (company_id);

create table public.employees (
  id text primary key,
  name text not null,
  jp text not null,
  animal text not null,
  color text not null,
  role text not null,
  role_jp text not null,
  img text not null,
  persona text not null
);

create table public.employee_state (
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id text not null references public.employees (id),
  activity text not null default '',
  perf int not null default 90,
  done int not null default 0,
  rec text not null default '',
  updated_at timestamptz not null default now(),
  primary key (company_id, employee_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id text not null references public.employees (id),
  text text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index tasks_company_employee_idx on public.tasks (company_id, employee_id);

create table public.company_vision (
  company_id uuid primary key references public.companies (id) on delete cascade,
  text text not null,
  progress_pct int not null default 0 check (progress_pct between 0 and 100),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  pct int not null default 0 check (pct between 0 and 100),
  owner_employee_id text not null references public.employees (id),
  position int not null default 0
);

create index goals_company_id_idx on public.goals (company_id);

create table public.kpis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  label text not null,
  value text not null,
  delta text not null default '',
  good boolean not null default true,
  position int not null default 0
);

create index kpis_company_id_idx on public.kpis (company_id);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  rec text not null,
  risk text not null check (risk in ('低', '中', '高')),
  by_employee_id text not null references public.employees (id),
  detail text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hold')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index decisions_company_id_idx on public.decisions (company_id);

create table public.decision_messages (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions (id) on delete cascade,
  employee_id text not null references public.employees (id),
  text text not null,
  stance text check (stance in ('dissent', 'revision')),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index decision_messages_decision_id_idx on public.decision_messages (decision_id);

create table public.decision_contributors (
  decision_id uuid not null references public.decisions (id) on delete cascade,
  employee_id text not null references public.employees (id),
  primary key (decision_id, employee_id)
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  owner_employee_id text not null references public.employees (id),
  pct int not null default 0 check (pct between 0 and 100),
  stages jsonb not null default '[]'::jsonb,
  current_stage int not null default 0
);

create index workflows_company_id_idx on public.workflows (company_id);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  employee_id text not null references public.employees (id),
  tag text not null,
  heat int not null default 0 check (heat between 0 and 100)
);

create index ideas_company_id_idx on public.ideas (company_id);

create table public.finance_summary (
  company_id uuid primary key references public.companies (id) on delete cascade,
  budget_exec_pct int not null default 0 check (budget_exec_pct between 0 and 100),
  suggestion text not null default ''
);

create table public.finance_kpis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  label text not null,
  value text not null,
  position int not null default 0
);

create table public.finance_costs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  dept text not null,
  pct int not null default 0 check (pct between 0 and 100),
  color text not null,
  position int not null default 0
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  due text not null,
  note text not null,
  position int not null default 0
);

create table public.brand_kpis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  label text not null,
  value text not null,
  delta text not null default '',
  position int not null default 0
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  status text not null,
  pct int not null default 0 check (pct between 0 and 100),
  position int not null default 0
);

create table public.market_insights (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id text not null references public.employees (id),
  text text not null,
  position int not null default 0
);

create table public.documentation_summary (
  company_id uuid primary key references public.companies (id) on delete cascade,
  coverage_pct int not null default 0 check (coverage_pct between 0 and 100)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  cat text not null,
  employee_id text not null references public.employees (id),
  doc_date text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index documents_company_id_idx on public.documents (company_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id text not null references public.employees (id),
  text text not null,
  room text not null,
  unread boolean not null default true,
  created_at timestamptz not null default now()
);

create index notifications_company_id_idx on public.notifications (company_id);

-- Live Activity feed; doubles as the audit-log foundation for "who approved what, when".
create table public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id text not null references public.employees (id),
  text text not null,
  created_at timestamptz not null default now()
);

create index activity_feed_company_id_idx on public.activity_feed (company_id, created_at desc);

-- Billing (Stripe) — schema in place now, wired up in the billing phase.
create table public.subscriptions (
  company_id uuid primary key references public.companies (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'trial',
  status text not null default 'trialing',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
