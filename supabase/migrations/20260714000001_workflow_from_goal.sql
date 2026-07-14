-- 課題1: Mission Room's Strategic Goals can spawn a Workflow. source_goal_id
-- links the workflow back to the goal it was created from; the unique index
-- (NULLs excluded implicitly by unique semantics) prevents creating more
-- than one workflow per goal.
alter table public.workflows
  add column source_goal_id uuid references public.goals (id) on delete set null;

create unique index workflows_source_goal_id_key
  on public.workflows (source_goal_id)
  where source_goal_id is not null;
