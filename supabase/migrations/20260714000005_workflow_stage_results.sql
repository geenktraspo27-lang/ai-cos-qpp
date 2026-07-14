-- 課題7: per-stage AI-generated execution results, reviewed and approved by
-- the founder before a Workflow is allowed to advance. Kept in its own
-- table (not columns on workflows) so each stage's generated content has
-- its own lifecycle (generated -> approved) independent of the Workflow row.

create table public.workflow_stage_results (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  stage_index int not null,
  stage_name text not null,
  employee_id text not null references public.employees (id),
  summary text not null,
  result text not null,
  status text not null default 'generated' check (status in ('generated', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- One result per stage, ever — regenerating an unapproved result updates
-- this row in place (see save_workflow_stage_result) rather than inserting
-- a second one.
create unique index workflow_stage_results_unique
  on public.workflow_stage_results (company_id, workflow_id, stage_index);

create index workflow_stage_results_workflow_idx
  on public.workflow_stage_results (workflow_id, stage_index);

alter table public.workflow_stage_results enable row level security;

create policy workflow_stage_results_company_scoped on public.workflow_stage_results
  for all using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- Atomically saves (creates or, if not yet approved, overwrites) the
-- current stage's AI-generated result plus its Activity entry. Re-derives
-- the workflow and its current_stage from the DB rather than trusting the
-- caller's stage_index, and refuses to touch an already-approved result —
-- that's what makes "承認済み結果は編集・再生成できない" hold even under
-- a race between two regenerate calls.
create or replace function public.save_workflow_stage_result(
  p_workflow_id uuid,
  p_summary text,
  p_result text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_wf public.workflows%rowtype;
  v_stage_name text;
  v_owner_name text;
  v_existing_status text;
  v_row_id uuid;
begin
  if v_company_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_wf
    from public.workflows
    where id = p_workflow_id and company_id = v_company_id
    for update;

  if not found then
    raise exception 'workflow not found';
  end if;

  if v_wf.current_stage >= jsonb_array_length(v_wf.stages) - 1 then
    raise exception 'workflow is already complete — nothing to execute';
  end if;

  v_stage_name := v_wf.stages ->> v_wf.current_stage;

  select status into v_existing_status
    from public.workflow_stage_results
    where company_id = v_company_id and workflow_id = p_workflow_id and stage_index = v_wf.current_stage
    for update;

  if v_existing_status = 'approved' then
    raise exception 'this stage has already been approved';
  end if;

  select name into v_owner_name from public.employees where id = v_wf.owner_employee_id;

  insert into public.workflow_stage_results
    (company_id, workflow_id, stage_index, stage_name, employee_id, summary, result, status)
    values (v_company_id, p_workflow_id, v_wf.current_stage, v_stage_name, v_wf.owner_employee_id, p_summary, p_result, 'generated')
  on conflict (company_id, workflow_id, stage_index)
    do update set
      stage_name = excluded.stage_name,
      summary = excluded.summary,
      result = excluded.result,
      status = 'generated',
      created_at = now(),
      approved_at = null
  returning id into v_row_id;

  insert into public.activity_feed (company_id, employee_id, text)
    values (v_company_id, v_wf.owner_employee_id, v_owner_name || 'が「' || v_stage_name || '」を実行しました');

  return jsonb_build_object('id', v_row_id, 'stageIndex', v_wf.current_stage, 'stageName', v_stage_name);
end;
$$;

grant execute on function public.save_workflow_stage_result(uuid, text, text) to authenticated;
