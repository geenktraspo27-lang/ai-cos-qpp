import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { employeeById } from '../data/employees';
import type { EmployeeId, RoomId } from '../types';

export interface GoalRow {
  id: string;
  name: string;
  pct: number;
  ownerEmployeeId: EmployeeId;
  position: number;
}

export interface KpiRow {
  id: string;
  label: string;
  value: string;
  delta: string;
  good: boolean;
  position: number;
}

export interface TaskRow {
  id: string;
  text: string;
  position: number;
}

export interface NotificationRow {
  id: string;
  employeeId: EmployeeId;
  text: string;
  room: RoomId;
  unread: boolean;
  createdAt: string;
}

export interface FeedRow {
  id: string;
  employeeId: EmployeeId;
  text: string;
  createdAt: string;
}

export interface EmployeeState {
  activity: string;
  perf: number;
  done: number;
  rec: string;
}

export interface DiscussionMessageRow {
  employeeId: EmployeeId;
  text: string;
  stance: 'dissent' | 'revision' | null;
}

export interface DecisionRow {
  id: string;
  title: string;
  rec: string;
  risk: '低' | '中' | '高';
  byEmployeeId: EmployeeId;
  detail: string;
  status: 'pending' | 'approved' | 'hold';
  discussion: DiscussionMessageRow[];
  contributors: EmployeeId[];
}

export interface WorkflowRow {
  id: string;
  name: string;
  ownerEmployeeId: EmployeeId;
  pct: number;
  stages: string[];
  currentStage: number;
  sourceGoalId: string | null;
}

/** 課題1: standard stage template used when a workflow is created from a Goal (no LLM generation yet). */
const DEFAULT_WORKFLOW_STAGES = ['計画', '実行', 'レビュー', '完了'];

/** 課題2: recommended progress % for the standard 4-stage template (計画/実行/レビュー/完了). */
const STANDARD_STAGE_PERCENTS = [0, 25, 75, 100];

function stagePercentFor(stageIndex: number, totalStages: number): number {
  if (totalStages === STANDARD_STAGE_PERCENTS.length) return STANDARD_STAGE_PERCENTS[stageIndex];
  if (totalStages <= 1) return 100;
  return Math.round((stageIndex / (totalStages - 1)) * 100);
}

export interface IdeaRow {
  id: string;
  title: string;
  employeeId: EmployeeId;
  tag: string;
  heat: number;
}

export interface FinanceKpiRow {
  id: string;
  label: string;
  value: string;
}

export interface FinanceCostRow {
  id: string;
  dept: string;
  pct: number;
  color: string;
}

export interface ContractRow {
  id: string;
  name: string;
  due: string;
  note: string;
}

export interface BrandKpiRow {
  id: string;
  label: string;
  value: string;
  delta: string;
}

export interface CampaignRow {
  id: string;
  name: string;
  status: string;
  pct: number;
}

export interface MarketInsightRow {
  id: string;
  employeeId: EmployeeId;
  text: string;
}

export interface DocumentRow {
  id: string;
  title: string;
  cat: string;
  employeeId: EmployeeId;
  date: string;
  summary: string;
}

interface CompanyData {
  loading: boolean;
  error: string | null;
  vision: string;
  visionProgressPct: number;
  goals: GoalRow[];
  kpis: KpiRow[];
  notifications: NotificationRow[];
  feed: FeedRow[];
  employeeStates: Partial<Record<EmployeeId, EmployeeState>>;
  tasksByEmployee: Partial<Record<EmployeeId, TaskRow[]>>;
  activeWorkflowsCount: number;
  pendingDecisionsCount: number;
  decisions: DecisionRow[];
  workflows: WorkflowRow[];
  ideas: IdeaRow[];
  financeBudgetExecPct: number;
  financeSuggestion: string;
  financeKpis: FinanceKpiRow[];
  financeCosts: FinanceCostRow[];
  contracts: ContractRow[];
  brandKpis: BrandKpiRow[];
  campaigns: CampaignRow[];
  marketInsights: MarketInsightRow[];
  docCoveragePct: number;
  documents: DocumentRow[];
  refetch: () => void;
  updateVision: (text: string) => void;
  addGoal: () => void;
  updateGoal: (id: string, patch: Partial<Pick<GoalRow, 'name' | 'pct' | 'ownerEmployeeId'>>) => void;
  removeGoal: (id: string) => void;
  addKpi: () => void;
  updateKpi: (id: string, patch: Partial<Pick<KpiRow, 'label' | 'value' | 'delta' | 'good'>>) => void;
  removeKpi: (id: string) => void;
  addTask: (employeeId: EmployeeId) => void;
  updateTask: (id: string, text: string) => void;
  removeTask: (employeeId: EmployeeId, id: string) => void;
  approveDecision: (id: string) => void;
  holdDecision: (id: string) => void;
  createWorkflowFromGoal: (goalId: string) => Promise<void>;
  advanceWorkflowStage: (workflowId: string) => Promise<void>;
}

const Ctx = createContext<CompanyData | null>(null);

export function CompanyDataProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vision, setVisionState] = useState('');
  const [visionProgressPct, setVisionProgressPct] = useState(0);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [kpis, setKpis] = useState<KpiRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [employeeStates, setEmployeeStates] = useState<Partial<Record<EmployeeId, EmployeeState>>>({});
  const [tasksByEmployee, setTasksByEmployee] = useState<Partial<Record<EmployeeId, TaskRow[]>>>({});
  const [activeWorkflowsCount, setActiveWorkflowsCount] = useState(0);
  const [pendingDecisionsCount, setPendingDecisionsCount] = useState(0);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [financeBudgetExecPct, setFinanceBudgetExecPct] = useState(0);
  const [financeSuggestion, setFinanceSuggestion] = useState('');
  const [financeKpis, setFinanceKpis] = useState<FinanceKpiRow[]>([]);
  const [financeCosts, setFinanceCosts] = useState<FinanceCostRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [brandKpis, setBrandKpis] = useState<BrandKpiRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsightRow[]>([]);
  const [docCoveragePct, setDocCoveragePct] = useState(0);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [refetchToken, setRefetchToken] = useState(0);

  const companyId = profile?.companyId;

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const [
        visionRes,
        goalsRes,
        kpisRes,
        notificationsRes,
        feedRes,
        employeeStateRes,
        tasksRes,
        workflowsCountRes,
        pendingDecisionsCountRes,
        decisionsRes,
        decisionMessagesRes,
        decisionContributorsRes,
        workflowsRes,
        ideasRes,
        financeSummaryRes,
        financeKpisRes,
        financeCostsRes,
        contractsRes,
        brandKpisRes,
        campaignsRes,
        marketInsightsRes,
        docSummaryRes,
        documentsRes,
      ] = await Promise.all([
        supabase.from('company_vision').select('text, progress_pct').eq('company_id', companyId!).single(),
        supabase.from('goals').select('id, name, pct, owner_employee_id, position').eq('company_id', companyId!).order('position'),
        supabase.from('kpis').select('id, label, value, delta, good, position').eq('company_id', companyId!).order('position'),
        supabase.from('notifications').select('id, employee_id, text, room, unread, created_at').eq('company_id', companyId!).order('created_at', { ascending: false }),
        supabase.from('activity_feed').select('id, employee_id, text, created_at').eq('company_id', companyId!).order('created_at', { ascending: false }).limit(10),
        supabase.from('employee_state').select('employee_id, activity, perf, done, rec').eq('company_id', companyId!),
        supabase.from('tasks').select('id, employee_id, text, position').eq('company_id', companyId!).order('position'),
        supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('company_id', companyId!),
        supabase.from('decisions').select('id', { count: 'exact', head: true }).eq('company_id', companyId!).eq('status', 'pending'),
        supabase.from('decisions').select('id, title, rec, risk, by_employee_id, detail, status').eq('company_id', companyId!).order('created_at'),
        supabase.from('decision_messages').select('decision_id, employee_id, text, stance, position').order('position'),
        supabase.from('decision_contributors').select('decision_id, employee_id'),
        supabase.from('workflows').select('id, name, owner_employee_id, pct, stages, current_stage, source_goal_id').eq('company_id', companyId!),
        supabase.from('ideas').select('id, title, employee_id, tag, heat').eq('company_id', companyId!),
        supabase.from('finance_summary').select('budget_exec_pct, suggestion').eq('company_id', companyId!).single(),
        supabase.from('finance_kpis').select('id, label, value, position').eq('company_id', companyId!).order('position'),
        supabase.from('finance_costs').select('id, dept, pct, color, position').eq('company_id', companyId!).order('position'),
        supabase.from('contracts').select('id, name, due, note, position').eq('company_id', companyId!).order('position'),
        supabase.from('brand_kpis').select('id, label, value, delta, position').eq('company_id', companyId!).order('position'),
        supabase.from('campaigns').select('id, name, status, pct, position').eq('company_id', companyId!).order('position'),
        supabase.from('market_insights').select('id, employee_id, text, position').eq('company_id', companyId!).order('position'),
        supabase.from('documentation_summary').select('coverage_pct').eq('company_id', companyId!).single(),
        supabase.from('documents').select('id, title, cat, employee_id, doc_date, summary').eq('company_id', companyId!).order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;

      const firstError =
        visionRes.error || goalsRes.error || kpisRes.error || notificationsRes.error ||
        feedRes.error || employeeStateRes.error || tasksRes.error ||
        workflowsCountRes.error || pendingDecisionsCountRes.error ||
        decisionsRes.error || decisionMessagesRes.error || decisionContributorsRes.error ||
        workflowsRes.error || ideasRes.error || financeSummaryRes.error ||
        financeKpisRes.error || financeCostsRes.error || contractsRes.error ||
        brandKpisRes.error || campaignsRes.error || marketInsightsRes.error ||
        docSummaryRes.error || documentsRes.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      setVisionState(visionRes.data?.text ?? '');
      setVisionProgressPct(visionRes.data?.progress_pct ?? 0);
      setGoals(
        (goalsRes.data ?? []).map((g) => ({
          id: g.id,
          name: g.name,
          pct: g.pct,
          ownerEmployeeId: g.owner_employee_id as EmployeeId,
          position: g.position,
        })),
      );
      setKpis(
        (kpisRes.data ?? []).map((k) => ({
          id: k.id,
          label: k.label,
          value: k.value,
          delta: k.delta,
          good: k.good,
          position: k.position,
        })),
      );
      setNotifications(
        (notificationsRes.data ?? []).map((n) => ({
          id: n.id,
          employeeId: n.employee_id as EmployeeId,
          text: n.text,
          room: n.room as RoomId,
          unread: n.unread,
          createdAt: n.created_at,
        })),
      );
      setFeed(
        (feedRes.data ?? []).map((f) => ({
          id: f.id,
          employeeId: f.employee_id as EmployeeId,
          text: f.text,
          createdAt: f.created_at,
        })),
      );
      const states: Partial<Record<EmployeeId, EmployeeState>> = {};
      for (const row of employeeStateRes.data ?? []) {
        states[row.employee_id as EmployeeId] = {
          activity: row.activity,
          perf: row.perf,
          done: row.done,
          rec: row.rec,
        };
      }
      setEmployeeStates(states);

      const tasksMap: Partial<Record<EmployeeId, TaskRow[]>> = {};
      for (const row of tasksRes.data ?? []) {
        const id = row.employee_id as EmployeeId;
        (tasksMap[id] ??= []).push({ id: row.id, text: row.text, position: row.position });
      }
      setTasksByEmployee(tasksMap);

      setActiveWorkflowsCount(workflowsCountRes.count ?? 0);
      setPendingDecisionsCount(pendingDecisionsCountRes.count ?? 0);

      const messagesByDecision = new Map<string, DiscussionMessageRow[]>();
      for (const m of decisionMessagesRes.data ?? []) {
        const list = messagesByDecision.get(m.decision_id) ?? [];
        list.push({ employeeId: m.employee_id as EmployeeId, text: m.text, stance: m.stance });
        messagesByDecision.set(m.decision_id, list);
      }
      const contributorsByDecision = new Map<string, EmployeeId[]>();
      for (const c of decisionContributorsRes.data ?? []) {
        const list = contributorsByDecision.get(c.decision_id) ?? [];
        list.push(c.employee_id as EmployeeId);
        contributorsByDecision.set(c.decision_id, list);
      }
      setDecisions(
        (decisionsRes.data ?? []).map((d) => ({
          id: d.id,
          title: d.title,
          rec: d.rec,
          risk: d.risk as '低' | '中' | '高',
          byEmployeeId: d.by_employee_id as EmployeeId,
          detail: d.detail,
          status: d.status as 'pending' | 'approved' | 'hold',
          discussion: messagesByDecision.get(d.id) ?? [],
          contributors: contributorsByDecision.get(d.id) ?? [],
        })),
      );

      setWorkflows(
        (workflowsRes.data ?? []).map((w) => ({
          id: w.id,
          name: w.name,
          ownerEmployeeId: w.owner_employee_id as EmployeeId,
          pct: w.pct,
          stages: w.stages,
          currentStage: w.current_stage,
          sourceGoalId: w.source_goal_id,
        })),
      );

      setIdeas(
        (ideasRes.data ?? []).map((i) => ({
          id: i.id,
          title: i.title,
          employeeId: i.employee_id as EmployeeId,
          tag: i.tag,
          heat: i.heat,
        })),
      );

      setFinanceBudgetExecPct(financeSummaryRes.data?.budget_exec_pct ?? 0);
      setFinanceSuggestion(financeSummaryRes.data?.suggestion ?? '');
      setFinanceKpis((financeKpisRes.data ?? []).map((k) => ({ id: k.id, label: k.label, value: k.value })));
      setFinanceCosts((financeCostsRes.data ?? []).map((c) => ({ id: c.id, dept: c.dept, pct: c.pct, color: c.color })));
      setContracts((contractsRes.data ?? []).map((c) => ({ id: c.id, name: c.name, due: c.due, note: c.note })));

      setBrandKpis((brandKpisRes.data ?? []).map((k) => ({ id: k.id, label: k.label, value: k.value, delta: k.delta })));
      setCampaigns((campaignsRes.data ?? []).map((c) => ({ id: c.id, name: c.name, status: c.status, pct: c.pct })));
      setMarketInsights(
        (marketInsightsRes.data ?? []).map((m) => ({ id: m.id, employeeId: m.employee_id as EmployeeId, text: m.text })),
      );

      setDocCoveragePct(docSummaryRes.data?.coverage_pct ?? 0);
      setDocuments(
        (documentsRes.data ?? []).map((d) => ({
          id: d.id,
          title: d.title,
          cat: d.cat,
          employeeId: d.employee_id as EmployeeId,
          date: d.doc_date,
          summary: d.summary,
        })),
      );

      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), []);

  const updateVision = useCallback(
    (text: string) => {
      setVisionState(text);
      if (!companyId) return;
      void supabase.from('company_vision').update({ text }).eq('company_id', companyId);
    },
    [companyId],
  );

  const addGoal = useCallback(() => {
    if (!companyId) return;
    const position = goals.length;
    void supabase
      .from('goals')
      .insert({ company_id: companyId, name: '新しい戦略目標', pct: 0, owner_employee_id: 'nova', position })
      .select('id, name, pct, owner_employee_id, position')
      .single()
      .then(({ data }) => {
        if (data) {
          setGoals((prev) => [
            ...prev,
            { id: data.id, name: data.name, pct: data.pct, ownerEmployeeId: data.owner_employee_id as EmployeeId, position: data.position },
          ]);
        }
      });
  }, [companyId, goals.length]);

  const updateGoal: CompanyData['updateGoal'] = useCallback((id, patch) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    void supabase
      .from('goals')
      .update({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.pct !== undefined && { pct: patch.pct }),
        ...(patch.ownerEmployeeId !== undefined && { owner_employee_id: patch.ownerEmployeeId }),
      })
      .eq('id', id);
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    void supabase.from('goals').delete().eq('id', id);
  }, []);

  const addKpi = useCallback(() => {
    if (!companyId) return;
    const position = kpis.length;
    void supabase
      .from('kpis')
      .insert({ company_id: companyId, label: '新しい指標', value: '—', delta: '', good: true, position })
      .select('id, label, value, delta, good, position')
      .single()
      .then(({ data }) => {
        if (data) {
          setKpis((prev) => [...prev, { id: data.id, label: data.label, value: data.value, delta: data.delta, good: data.good, position: data.position }]);
        }
      });
  }, [companyId, kpis.length]);

  const updateKpi: CompanyData['updateKpi'] = useCallback((id, patch) => {
    setKpis((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)));
    void supabase.from('kpis').update(patch).eq('id', id);
  }, []);

  const removeKpi = useCallback((id: string) => {
    setKpis((prev) => prev.filter((k) => k.id !== id));
    void supabase.from('kpis').delete().eq('id', id);
  }, []);

  const addTask = useCallback(
    (employeeId: EmployeeId) => {
      if (!companyId) return;
      const position = tasksByEmployee[employeeId]?.length ?? 0;
      void supabase
        .from('tasks')
        .insert({ company_id: companyId, employee_id: employeeId, text: '新しいタスク', position })
        .select('id, text, position')
        .single()
        .then(({ data }) => {
          if (data) {
            setTasksByEmployee((prev) => ({
              ...prev,
              [employeeId]: [...(prev[employeeId] ?? []), { id: data.id, text: data.text, position: data.position }],
            }));
          }
        });
    },
    [companyId, tasksByEmployee],
  );

  const updateTask = useCallback((id: string, text: string) => {
    setTasksByEmployee((prev) => {
      const next: Partial<Record<EmployeeId, TaskRow[]>> = {};
      for (const [empId, list] of Object.entries(prev) as [EmployeeId, TaskRow[]][]) {
        next[empId] = list.map((t) => (t.id === id ? { ...t, text } : t));
      }
      return next;
    });
    void supabase.from('tasks').update({ text }).eq('id', id);
  }, []);

  const removeTask = useCallback((employeeId: EmployeeId, id: string) => {
    setTasksByEmployee((prev) => ({
      ...prev,
      [employeeId]: (prev[employeeId] ?? []).filter((t) => t.id !== id),
    }));
    void supabase.from('tasks').delete().eq('id', id);
  }, []);

  const decideDecision = useCallback(
    (id: string, status: 'approved' | 'hold') => {
      const wasPending = decisions.find((d) => d.id === id)?.status === 'pending';
      setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
      if (wasPending) setPendingDecisionsCount((count) => Math.max(0, count - 1));
      void supabase.from('decisions').update({ status, decided_at: new Date().toISOString() }).eq('id', id);
    },
    [decisions],
  );

  const approveDecision = useCallback((id: string) => decideDecision(id, 'approved'), [decideDecision]);
  const holdDecision = useCallback((id: string) => decideDecision(id, 'hold'), [decideDecision]);

  /** 課題1: Mission Room's Goals can spawn a Workflow (no LLM stage generation yet — standard template). */
  const createWorkflowFromGoal = useCallback(
    async (goalId: string) => {
      if (!companyId) return;
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;
      if (workflows.some((w) => w.sourceGoalId === goalId)) return;

      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          company_id: companyId,
          name: goal.name,
          owner_employee_id: goal.ownerEmployeeId,
          pct: 0,
          stages: DEFAULT_WORKFLOW_STAGES,
          current_stage: 0,
          source_goal_id: goalId,
        })
        .select('id, name, owner_employee_id, pct, stages, current_stage, source_goal_id')
        .single();

      if (workflowError || !workflow) {
        throw workflowError ?? new Error('Failed to create workflow');
      }

      setWorkflows((prev) => [
        ...prev,
        {
          id: workflow.id,
          name: workflow.name,
          ownerEmployeeId: workflow.owner_employee_id as EmployeeId,
          pct: workflow.pct,
          stages: workflow.stages,
          currentStage: workflow.current_stage,
          sourceGoalId: workflow.source_goal_id,
        },
      ]);
      setActiveWorkflowsCount((count) => count + 1);

      const owner = employeeById(goal.ownerEmployeeId);
      const feedText = `${owner.name}が「${goal.name}」のWorkflowを作成しました`;

      const { data: feedRow } = await supabase
        .from('activity_feed')
        .insert({ company_id: companyId, employee_id: goal.ownerEmployeeId, text: feedText })
        .select('id, employee_id, text, created_at')
        .single();
      if (feedRow) {
        setFeed((prev) => [
          { id: feedRow.id, employeeId: feedRow.employee_id as EmployeeId, text: feedRow.text, createdAt: feedRow.created_at },
          ...prev,
        ]);
      }

      const { data: notifRow } = await supabase
        .from('notifications')
        .insert({
          company_id: companyId,
          employee_id: goal.ownerEmployeeId,
          text: '新しいWorkflowが作成されました',
          room: 'workflow',
          unread: true,
        })
        .select('id, employee_id, text, room, unread, created_at')
        .single();
      if (notifRow) {
        setNotifications((prev) => [
          {
            id: notifRow.id,
            employeeId: notifRow.employee_id as EmployeeId,
            text: notifRow.text,
            room: notifRow.room as RoomId,
            unread: notifRow.unread,
            createdAt: notifRow.created_at,
          },
          ...prev,
        ]);
      }
    },
    [companyId, goals, workflows],
  );

  /**
   * 課題2: advance a workflow by exactly one stage. The `.eq('current_stage', ...)`
   * guard makes the update a no-op (0 rows) if the stage already moved since
   * we read it — belt-and-braces against double-clicks/races on top of the
   * UI-level disabled state, so a workflow can never skip a stage.
   */
  const advanceWorkflowStage = useCallback(
    async (workflowId: string) => {
      if (!companyId) return;
      const wf = workflows.find((w) => w.id === workflowId);
      if (!wf) return;
      const lastIndex = wf.stages.length - 1;
      if (wf.currentStage >= lastIndex) return;

      const nextStage = wf.currentStage + 1;
      const isComplete = nextStage === lastIndex;
      const nextPct = stagePercentFor(nextStage, wf.stages.length);

      const { data: updated, error: updateError } = await supabase
        .from('workflows')
        .update({ current_stage: nextStage, pct: nextPct })
        .eq('id', workflowId)
        .eq('current_stage', wf.currentStage)
        .select('id, current_stage, pct')
        .single();

      if (updateError || !updated) {
        // Either a real error, or another click already advanced this
        // workflow first (0 rows matched) — either way, nothing to apply.
        return;
      }

      setWorkflows((prev) =>
        prev.map((w) => (w.id === workflowId ? { ...w, currentStage: updated.current_stage, pct: updated.pct } : w)),
      );

      if (wf.sourceGoalId) {
        const goalId = wf.sourceGoalId;
        setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, pct: nextPct } : g)));
        void supabase.from('goals').update({ pct: nextPct }).eq('id', goalId);
      }

      const owner = employeeById(wf.ownerEmployeeId);
      const stageLabel = wf.stages[nextStage];
      const feedText = isComplete
        ? `${owner.name}が「${wf.name}」を完了しました`
        : `${owner.name}が「${wf.name}」を${stageLabel}に進めました`;

      const { data: feedRow } = await supabase
        .from('activity_feed')
        .insert({ company_id: companyId, employee_id: wf.ownerEmployeeId, text: feedText })
        .select('id, employee_id, text, created_at')
        .single();
      if (feedRow) {
        setFeed((prev) => [
          { id: feedRow.id, employeeId: feedRow.employee_id as EmployeeId, text: feedRow.text, createdAt: feedRow.created_at },
          ...prev,
        ]);
      }

      if (isComplete) {
        const { data: notifRow } = await supabase
          .from('notifications')
          .insert({
            company_id: companyId,
            employee_id: wf.ownerEmployeeId,
            text: `Workflow「${wf.name}」が完了しました`,
            room: 'workflow',
            unread: true,
          })
          .select('id, employee_id, text, room, unread, created_at')
          .single();
        if (notifRow) {
          setNotifications((prev) => [
            {
              id: notifRow.id,
              employeeId: notifRow.employee_id as EmployeeId,
              text: notifRow.text,
              room: notifRow.room as RoomId,
              unread: notifRow.unread,
              createdAt: notifRow.created_at,
            },
            ...prev,
          ]);
        }
      }
    },
    [companyId, workflows],
  );

  const value = useMemo<CompanyData>(
    () => ({
      loading,
      error,
      vision,
      visionProgressPct,
      goals,
      kpis,
      notifications,
      feed,
      employeeStates,
      tasksByEmployee,
      activeWorkflowsCount,
      pendingDecisionsCount,
      decisions,
      workflows,
      ideas,
      financeBudgetExecPct,
      financeSuggestion,
      financeKpis,
      financeCosts,
      contracts,
      brandKpis,
      campaigns,
      marketInsights,
      docCoveragePct,
      documents,
      refetch,
      updateVision,
      addGoal,
      updateGoal,
      removeGoal,
      addKpi,
      updateKpi,
      removeKpi,
      addTask,
      updateTask,
      removeTask,
      approveDecision,
      holdDecision,
      createWorkflowFromGoal,
      advanceWorkflowStage,
    }),
    [
      loading, error, vision, visionProgressPct, goals, kpis, notifications, feed,
      employeeStates, tasksByEmployee, activeWorkflowsCount, pendingDecisionsCount,
      decisions, workflows, ideas, financeBudgetExecPct, financeSuggestion, financeKpis,
      financeCosts, contracts, brandKpis, campaigns, marketInsights, docCoveragePct, documents,
      refetch, updateVision, addGoal, updateGoal,
      removeGoal, addKpi, updateKpi, removeKpi, addTask, updateTask, removeTask,
      approveDecision, holdDecision, createWorkflowFromGoal, advanceWorkflowStage,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompanyData(): CompanyData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCompanyData must be used within CompanyDataProvider');
  return ctx;
}
