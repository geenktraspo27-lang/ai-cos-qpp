-- 修正課題: Document detail view needs a full-body field distinct from the
-- card's short `summary` — add `content`, nullable so existing seeded
-- documents (which only ever had `summary`) keep working with no body.
alter table public.documents
  add column content text;

-- Completion Reports should populate `content` with the same full report
-- text as `summary`, so the detail modal has something to show.
create or replace function public.complete_workflow(p_workflow_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_wf public.workflows%rowtype;
  v_last_index int;
  v_owner_name text;
  v_goal_name text;
  v_stage_lines text := '';
  v_stage text;
  v_ordinal int;
  v_summary text;
  v_knowledge_content text;
  v_doc_id uuid;
  v_knowledge_id uuid;
  v_completed_at text := to_char(now(), 'YYYY-MM-DD HH24:MI');
  v_doc_date text := to_char(now(), 'FMMM"/"FMDD');
begin
  if v_company_id is null then
    raise exception 'not authenticated';
  end if;

  -- Row lock, scoped to the caller's own company — a workflow belonging to
  -- another company simply won't be found, giving cross-tenant protection
  -- for free.
  select * into v_wf
    from public.workflows
    where id = p_workflow_id and company_id = v_company_id
    for update;

  if not found then
    raise exception 'workflow not found';
  end if;

  v_last_index := jsonb_array_length(v_wf.stages) - 1;

  -- Idempotent: if this workflow is already at its final stage, someone
  -- already completed it (or this is a retry after the first call
  -- succeeded) — just return the existing report, no duplicate side effects.
  if v_wf.current_stage < v_last_index then
    update public.workflows
      set current_stage = v_last_index, pct = 100
      where id = v_wf.id;
    v_wf.current_stage := v_last_index;
    v_wf.pct := 100;

    if v_wf.source_goal_id is not null then
      update public.goals set pct = 100 where id = v_wf.source_goal_id and company_id = v_company_id;
    end if;

    select name into v_owner_name from public.employees where id = v_wf.owner_employee_id;

    insert into public.activity_feed (company_id, employee_id, text)
      values (v_company_id, v_wf.owner_employee_id, v_owner_name || 'が「' || v_wf.name || '」を完了しました');

    insert into public.notifications (company_id, employee_id, text, room, unread)
      values (v_company_id, v_wf.owner_employee_id, 'Workflow「' || v_wf.name || '」が完了しました', 'workflow', true);
  end if;

  select name into v_owner_name from public.employees where id = v_wf.owner_employee_id;
  select name into v_goal_name from public.goals where id = v_wf.source_goal_id and company_id = v_company_id;

  for v_ordinal, v_stage in
    select ordinality, value from jsonb_array_elements_text(v_wf.stages) with ordinality
  loop
    v_stage_lines := v_stage_lines || v_ordinal || '. ' || v_stage || chr(10);
  end loop;

  v_summary :=
    '対象Mission/Strategic Goal: ' || coalesce(v_goal_name, '(紐づくGoalなし)') || chr(10) ||
    '担当AI社員: ' || v_owner_name || chr(10) ||
    '実行したステージ:' || chr(10) || v_stage_lines ||
    '最終進捗: 100%' || chr(10) ||
    '完了日時: ' || v_completed_at || chr(10) ||
    'Workflow ID: ' || v_wf.id;

  insert into public.documents (company_id, title, cat, employee_id, doc_date, summary, content, source_workflow_id)
    values (v_company_id, '「' || v_wf.name || '」完了報告', 'Completion Report', v_wf.owner_employee_id, v_doc_date, v_summary, v_summary, v_wf.id)
    on conflict (company_id, source_workflow_id) where source_workflow_id is not null do nothing
    returning id into v_doc_id;

  -- Only announce the report — and derive Knowledge from it — if this call
  -- actually created it. A retry that hits the ON CONFLICT branch must stay
  -- silent and must not create a second Knowledge entry either.
  if v_doc_id is not null then
    insert into public.activity_feed (company_id, employee_id, text)
      values (v_company_id, v_wf.owner_employee_id, v_owner_name || 'が「' || v_wf.name || '」の完了報告を作成しました');

    insert into public.notifications (company_id, employee_id, text, room, unread)
      values (v_company_id, v_wf.owner_employee_id, '完了報告が作成されました', 'docs', true);

    v_knowledge_content :=
      '対象Goal: ' || coalesce(v_goal_name, '(紐づくGoalなし)') || chr(10) ||
      '担当AI社員: ' || v_owner_name || chr(10) ||
      '実行したステージ:' || chr(10) || v_stage_lines ||
      '完了日時: ' || v_completed_at || chr(10) ||
      '完了報告への参照: 「' || v_wf.name || '」完了報告 (Document ID: ' || v_doc_id || ')';

    insert into public.ideas (company_id, title, employee_id, tag, heat, content, source_document_id)
      values (v_company_id, '「' || v_wf.name || '」から得られた知識', v_wf.owner_employee_id, 'Workflow Outcome', 100, v_knowledge_content, v_doc_id)
      on conflict (company_id, source_document_id) where source_document_id is not null do nothing
      returning id into v_knowledge_id;

    if v_knowledge_id is not null then
      insert into public.activity_feed (company_id, employee_id, text)
        values (v_company_id, v_wf.owner_employee_id, v_owner_name || 'が「' || v_wf.name || '」の成果をBrainに保存しました');

      insert into public.notifications (company_id, employee_id, text, room, unread)
        values (v_company_id, v_wf.owner_employee_id, '新しいKnowledgeがBrainに保存されました', 'brain', true);
    end if;
  else
    select id into v_doc_id from public.documents
      where company_id = v_company_id and source_workflow_id = v_wf.id;
  end if;

  return jsonb_build_object(
    'workflow_id', v_wf.id,
    'current_stage', v_wf.current_stage,
    'pct', v_wf.pct,
    'document_id', v_doc_id
  );
end;
$$;

grant execute on function public.complete_workflow(uuid) to authenticated;
