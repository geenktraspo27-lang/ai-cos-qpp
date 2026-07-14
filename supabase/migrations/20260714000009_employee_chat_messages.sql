-- 課題10: AI社員とのチャット。1メッセージ = 1行。company_id/user_id は
-- current_company_id()/auth.uid() のcolumn defaultで自動設定されるため、
-- サーバー側のinsertはemployee_id/role/contentだけ渡せば安全に company_id が
-- 決まる(クライアントが偽装できない)。RLSのwith checkが二重に強制する。
create table public.employee_chat_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies (id) on delete cascade,
  employee_id text not null references public.employees (id),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index employee_chat_messages_company_employee_idx
  on public.employee_chat_messages (company_id, employee_id, created_at);

alter table public.employee_chat_messages enable row level security;

create policy employee_chat_messages_company_scoped on public.employee_chat_messages
  for all using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
