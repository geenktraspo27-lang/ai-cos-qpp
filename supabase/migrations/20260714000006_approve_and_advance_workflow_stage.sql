-- 課題7.5: approving a stage result and advancing the Workflow were two
-- separate client-side operations (a guarded UPDATE on
-- workflow_stage_results, then either complete_workflow or a plain
-- workflow update+goal sync+activity insert). A failure between those two
-- steps could leave a stage marked 'approved' with the Workflow never
-- having moved. This RPC does the whole approve→advance→(complete) chain
-- in one transaction — the client now calls this once instead of the
-- multi-step sequence advanceWorkflowStage used to run.
create or replace function public.approve_and_advance_workflow_stage(
  p_workflow_id uuid,
  p_expected_stage_index int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_wf public.workflows%rowtype;
  v_last_index int;
  v_stage_result_id uuid;
  v_stage_result_status text;
  v_next_stage int;
  v_next_pct int;
  v_stage_label text;
  v_owner_name text;
  v_complete_result jsonb;
begin
  if v_company_id is null then
    raise exception 'not authenticated';
  end if;

  -- Row lock scoped to the caller's own company — a workflow belonging to
  -- another company simply won't be found, giving cross-tenant protection
  -- for free (same pattern as complete_workflow).
  select * into v_wf
    from public.workflows
    where id = p_workflow_id and company_id = v_company_id
    for update;

  if not found then
    raise exception 'workflow not found';
  end if;

  v_last_index := jsonb_array_length(v_wf.stages) - 1;

  -- Idempotency + stale-screen guard: if the Workflow has already moved
  -- past the stage this request was built against, there is nothing left
  -- to do — either this is a retried request that already succeeded, or
  -- the screen it came from is stale because someone else already
  -- approved it. Either way, report current state instead of erroring or
  -- advancing a second time.
  if v_wf.current_stage > p_expected_stage_index then
    return jsonb_build_object(
      'workflow_id', v_wf.id, 'current_stage', v_wf.current_stage, 'pct', v_wf.pct,
      'already_processed', true
    );
  end if;

  if v_wf.current_stage < p_expected_stage_index then
    raise exception 'unexpected stage index: workflow is behind the caller''s expectation';
  end if;

  if v_wf.current_stage >= v_last_index then
    raise exception 'workflow is already complete';
  end if;

  -- The target result is always looked up by the Workflow's OWN current
  -- stage — never by a caller-supplied stage_index — so the result's
  -- stage_index and the Workflow's current position can never diverge.
  select id, status into v_stage_result_id, v_stage_result_status
    from public.workflow_stage_results
    where company_id = v_company_id and workflow_id = p_workflow_id and stage_index = v_wf.current_stage
    for update;

  if v_stage_result_status = 'approved' then
    -- Already approved but (shouldn't normally happen, since this function
    -- is the only place that approves a result) the Workflow row hadn't
    -- advanced yet — treat the same as "already processed".
    return jsonb_build_object(
      'workflow_id', v_wf.id, 'current_stage', v_wf.current_stage, 'pct', v_wf.pct,
      'already_processed', true
    );
  end if;

  if v_stage_result_id is null or v_stage_result_status is distinct from 'generated' then
    raise exception 'no generated result to approve for this stage';
  end if;

  update public.workflow_stage_results
    set status = 'approved', approved_at = now()
    where id = v_stage_result_id;

  v_next_stage := v_wf.current_stage + 1;
  v_stage_label := v_wf.stages ->> v_next_stage;
  select name into v_owner_name from public.employees where id = v_wf.owner_employee_id;

  if v_next_stage = v_last_index then
    -- Final transition: delegate to complete_workflow. It runs inside this
    -- same transaction (a Postgres function call never opens a new one),
    -- so if anything in there fails — including Completion Report or Brain
    -- Knowledge creation — the workflow_stage_results approval above rolls
    -- back with it.
    v_complete_result := public.complete_workflow(p_workflow_id);
    return v_complete_result || jsonb_build_object('already_processed', false);
  end if;

  v_next_pct := case
    when jsonb_array_length(v_wf.stages) = 4 then (array[0, 25, 75, 100])[v_next_stage + 1]
    when jsonb_array_length(v_wf.stages) <= 1 then 100
    else round(v_next_stage::numeric / (jsonb_array_length(v_wf.stages) - 1) * 100)::int
  end;

  update public.workflows
    set current_stage = v_next_stage, pct = v_next_pct
    where id = p_workflow_id;

  if v_wf.source_goal_id is not null then
    update public.goals set pct = v_next_pct where id = v_wf.source_goal_id and company_id = v_company_id;
  end if;

  insert into public.activity_feed (company_id, employee_id, text)
    values (v_company_id, v_wf.owner_employee_id, v_owner_name || 'が「' || v_wf.name || '」を' || v_stage_label || 'に進めました');

  return jsonb_build_object(
    'workflow_id', v_wf.id, 'current_stage', v_next_stage, 'pct', v_next_pct,
    'already_processed', false
  );
end;
$$;

grant execute on function public.approve_and_advance_workflow_stage(uuid, int) to authenticated;
