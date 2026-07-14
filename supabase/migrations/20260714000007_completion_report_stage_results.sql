-- 課題8: Completion Report / Brain Knowledge now include each approved
-- stage's actual AI-generated work (summary + detailed result), instead of
-- just the stage name list. Only status='approved' rows are used, in
-- stage_index order, scoped to this workflow within the caller's own
-- company (same RLS-equivalent scoping complete_workflow already used).
-- Everything else about complete_workflow — the atomic completion
-- side-effects, the ON CONFLICT dedup on documents/ideas, the cross-tenant
-- row lock — is unchanged; only the report/knowledge text is richer.
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
  v_summary text;
  v_content text;
  v_report_block text := '';
  v_knowledge_block text := '';
  v_seq int := 0;
  r record;
  v_doc_id uuid;
  v_knowledge_id uuid;
  v_completed_at text := to_char(now(), 'YYYY-MM-DD HH24:MI');
  v_doc_date text := to_char(now(), 'FMMM"/"FMDD');
  v_no_results_line text := 'このWorkflowには保存された実行結果がありません。';
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

  -- Only this workflow's own, approved-only, stage_index-ordered results —
  -- never another company's rows, never an unapproved/rejected one.
  for r in
    select stage_name, summary, result
    from public.workflow_stage_results
    where company_id = v_company_id and workflow_id = v_wf.id and status = 'approved'
    order by stage_index
  loop
    v_seq := v_seq + 1;
    v_report_block := v_report_block ||
      '【' || v_seq || '. ' || r.stage_name || '】' || chr(10) ||
      '要約：' || chr(10) || r.summary || chr(10) || chr(10) ||
      '詳細：' || chr(10) || r.result || chr(10) || chr(10);
    v_knowledge_block := v_knowledge_block || v_seq || '. ' || r.stage_name || '：' || r.summary || chr(10);
  end loop;

  -- Older/legacy workflows may have no saved stage results at all (they
  -- predate this feature, or were completed before any stage was
  -- executed) — that must not block completion, just say so plainly.
  if v_seq = 0 then
    v_report_block := v_no_results_line || chr(10) || chr(10);
    v_knowledge_block := v_no_results_line || chr(10);
  end if;

  v_summary := v_seq || 'つのステージを完了し、「' || v_wf.name || '」を達成しました。';

  v_content :=
    'Workflow完了報告' || chr(10) || chr(10) ||
    '対象Goal：' || chr(10) || coalesce(v_goal_name, '(紐づくGoalなし)') || chr(10) || chr(10) ||
    '担当：' || chr(10) || v_owner_name || chr(10) || chr(10) ||
    '実行結果：' || chr(10) || chr(10) ||
    v_report_block ||
    '最終進捗：' || chr(10) || '100%' || chr(10) || chr(10) ||
    '完了日時：' || chr(10) || v_completed_at;

  insert into public.documents (company_id, title, cat, employee_id, doc_date, summary, content, source_workflow_id)
    values (v_company_id, '「' || v_wf.name || '」完了報告', 'Completion Report', v_wf.owner_employee_id, v_doc_date, v_summary, v_content, v_wf.id)
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

    insert into public.ideas (company_id, title, employee_id, tag, heat, content, source_document_id)
      values (
        v_company_id,
        '「' || v_wf.name || '」から得られた知識',
        v_wf.owner_employee_id,
        'Workflow Outcome',
        100,
        '対象Goal: ' || coalesce(v_goal_name, '(紐づくGoalなし)') || chr(10) ||
          '担当AI社員: ' || v_owner_name || chr(10) ||
          '各ステージの要約:' || chr(10) || v_knowledge_block ||
          '完了日時: ' || v_completed_at || chr(10) ||
          '完了報告への参照: 「' || v_wf.name || '」完了報告 (Document ID: ' || v_doc_id || ')',
        v_doc_id
      )
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
