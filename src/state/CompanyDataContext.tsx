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

/** 課題7: one AI-generated (then founder-approved) result per Workflow stage. */
export interface WorkflowStageResultRow {
  id: string;
  workflowId: string;
  stageIndex: number;
  stageName: string;
  employeeId: EmployeeId;
  summary: string;
  result: string;
  status: 'generated' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt: string | null;
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
  content: string | null;
  sourceDocumentId: string | null;
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
  content: string;
  sourceWorkflowId: string | null;
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
  workflowStageResults: WorkflowStageResultRow[];
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
  executeWorkflowStage: (workflowId: string) => Promise<void>;
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
  const [workflowStageResults, setWorkflowStageResults] = useState<WorkflowStageResultRow[]>([]);
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
        workflowStageResultsRes,
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
        supabase.from('ideas').select('id, title, employee_id, tag, heat, content, source_document_id').eq('company_id', companyId!),
        supabase.from('finance_summary').select('budget_exec_pct, suggestion').eq('company_id', companyId!).single(),
        supabase.from('finance_kpis').select('id, label, value, position').eq('company_id', companyId!).order('position'),
        supabase.from('finance_costs').select('id, dept, pct, color, position').eq('company_id', companyId!).order('position'),
        supabase.from('contracts').select('id, name, due, note, position').eq('company_id', companyId!).order('position'),
        supabase.from('brand_kpis').select('id, label, value, delta, position').eq('company_id', companyId!).order('position'),
        supabase.from('campaigns').select('id, name, status, pct, position').eq('company_id', companyId!).order('position'),
        supabase.from('market_insights').select('id, employee_id, text, position').eq('company_id', companyId!).order('position'),
        supabase.from('documentation_summary').select('coverage_pct').eq('company_id', companyId!).single(),
        supabase.from('documents').select('id, title, cat, employee_id, doc_date, summary, content, source_workflow_id').eq('company_id', companyId!).order('created_at', { ascending: false }),
        supabase.from('workflow_stage_results').select('id, workflow_id, stage_index, stage_name, employee_id, summary, result, status, created_at, approved_at').eq('company_id', companyId!),
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
        docSummaryRes.error || documentsRes.error || workflowStageResultsRes.error;
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
          content: i.content,
          sourceDocumentId: i.source_document_id,
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
          content: d.content ?? '',
          sourceWorkflowId: d.source_workflow_id,
        })),
      );

      setWorkflowStageResults(
        (workflowStageResultsRes.data ?? []).map((r) => ({
          id: r.id,
          workflowId: r.workflow_id,
          stageIndex: r.stage_index,
          stageName: r.stage_name,
          employeeId: r.employee_id as EmployeeId,
          summary: r.summary,
          result: r.result,
          status: r.status,
          createdAt: r.created_at,
          approvedAt: r.approved_at,
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

  /**
   * 課題5/6: Mission Room's Goals spawn a Workflow whose name and stages are
   * designed by Nova via the server-side LLMService (/api/generate-workflow —
   * the ANTHROPIC_API_KEY never reaches the client), reflecting the Goal's
   * assigned AI employee's role/specialty. Saving the Workflow itself still
   * goes through the same Supabase insert 課題1 introduced; the LLM only
   * supplies workflowName/stages. The server re-derives the employee from
   * Supabase (RLS-scoped to this company) rather than trusting the
   * name/role/specialty sent here — those are just a hint for which
   * employee.id to look up.
   */
  const createWorkflowFromGoal = useCallback(
    async (goalId: string) => {
      if (!companyId) return;
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;
      if (workflows.some((w) => w.sourceGoalId === goalId)) return;

      const ownerEmployee = employeeById(goal.ownerEmployeeId);
      let workflowName = goal.name;
      let stages: string[] = DEFAULT_WORKFLOW_STAGES;
      let usedFallback = true;
      let fallbackReason: 'employee_lookup_failed' | 'llm_failed' | undefined;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch('/api/generate-workflow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            companyVision: vision,
            goalTitle: goal.name,
            employee: {
              id: ownerEmployee.id,
              name: ownerEmployee.name,
              role: ownerEmployee.roleJp,
              specialty: ownerEmployee.persona,
            },
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            workflowName?: unknown;
            stages?: unknown;
            usedFallback?: unknown;
            fallbackReason?: unknown;
          };
          const validStages =
            Array.isArray(data.stages) &&
            data.stages.length >= 4 &&
            data.stages.length <= 8 &&
            data.stages.every((s) => typeof s === 'string' && s.trim() !== '');
          if (typeof data.workflowName === 'string' && data.workflowName.trim() !== '' && validStages) {
            workflowName = data.workflowName;
            stages = data.stages as string[];
            usedFallback = data.usedFallback === true;
            fallbackReason =
              data.fallbackReason === 'employee_lookup_failed' || data.fallbackReason === 'llm_failed'
                ? data.fallbackReason
                : undefined;
          }
        }
      } catch {
        // Network/endpoint failure — keep the local fixed fallback below.
      }

      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          company_id: companyId,
          name: workflowName,
          owner_employee_id: goal.ownerEmployeeId,
          pct: 0,
          stages,
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

      const feedText = !usedFallback
        ? 'NovaがWorkflowを設計しました'
        : fallbackReason === 'employee_lookup_failed'
          ? 'Novaは担当社員情報を取得できなかったため、標準Workflowを生成しました'
          : 'Novaは標準Workflowを生成しました';

      const { data: feedRow } = await supabase
        .from('activity_feed')
        .insert({ company_id: companyId, employee_id: 'nova', text: feedText })
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
    [companyId, goals, workflows, vision],
  );

  /**
   * 課題2/3/7: advance a workflow by exactly one stage — now the "承認して
   * 次へ進む" action. This is the ONLY path that moves a Workflow's stage,
   * so gating it on an approval here is what keeps "AI generated a result"
   * and "the company officially progressed" distinct: it first tries to
   * flip that stage's workflow_stage_results row from 'generated' to
   * 'approved' (guarded so a race or a stage with no generated result yet
   * is a safe no-op), and only proceeds to the existing stage-advance logic
   * if that approval actually happened.
   *
   * The `.eq('current_stage', ...)` guard below makes the workflow update a
   * no-op (0 rows) if the stage already moved since we read it — belt-and-
   * braces against double-clicks/races on top of the UI-level disabled
   * state, so a workflow can never skip a stage.
   *
   * The final advance (reaching the last stage) is instead delegated to the
   * complete_workflow RPC, which applies the completion side-effects and
   * generates the Documentation completion report atomically in one
   * transaction — doing that as separate client-side calls could leave a
   * completed Workflow without its report (or vice versa) if one call failed.
   */
  const advanceWorkflowStage = useCallback(
    async (workflowId: string) => {
      if (!companyId) return;
      const wf = workflows.find((w) => w.id === workflowId);
      if (!wf) return;
      const lastIndex = wf.stages.length - 1;
      if (wf.currentStage >= lastIndex) return;

      const { data: approvedRow, error: approveError } = await supabase
        .from('workflow_stage_results')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('workflow_id', workflowId)
        .eq('stage_index', wf.currentStage)
        .eq('status', 'generated')
        .select('id')
        .single();
      if (approveError || !approvedRow) {
        // No generated result to approve for this stage (or it was already
        // approved/rejected) — nothing to advance.
        return;
      }
      setWorkflowStageResults((prev) =>
        prev.map((r) =>
          r.id === approvedRow.id ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r,
        ),
      );

      const nextStage = wf.currentStage + 1;
      const isComplete = nextStage === lastIndex;

      if (isComplete) {
        const { error } = await supabase.rpc('complete_workflow', { p_workflow_id: workflowId });
        if (error) throw error;
        refetch();
        return;
      }

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
      const feedText = `${owner.name}が「${wf.name}」を${stageLabel}に進めました`;

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
    },
    [companyId, workflows, refetch],
  );

  /**
   * 課題7: has the current stage's assigned AI employee "execute" it via
   * /api/execute-workflow-stage, which derives the Workflow/Goal/Vision/
   * employee/prior-results context itself (RLS-scoped to this company) and
   * saves the result server-side — this call only sends workflowId. There
   * is deliberately no fallback here: on any failure we just refetch()
   * nothing and rethrow, so the caller (Workflow Room) can show the fixed
   * "実行結果を生成できませんでした" message without the stage having moved
   * or a placeholder result having been saved.
   */
  const executeWorkflowStage = useCallback(async (workflowId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch('/api/execute-workflow-stage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ workflowId }),
    });
    if (!res.ok) {
      throw new Error('Failed to execute workflow stage');
    }
    refetch();
  }, [refetch]);

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
      workflowStageResults,
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
      executeWorkflowStage,
    }),
    [
      loading, error, vision, visionProgressPct, goals, kpis, notifications, feed,
      employeeStates, tasksByEmployee, activeWorkflowsCount, pendingDecisionsCount,
      decisions, workflows, ideas, financeBudgetExecPct, financeSuggestion, financeKpis,
      financeCosts, contracts, brandKpis, campaigns, marketInsights, docCoveragePct, documents,
      workflowStageResults, refetch, updateVision, addGoal, updateGoal,
      removeGoal, addKpi, updateKpi, removeKpi, addTask, updateTask, removeTask,
      approveDecision, holdDecision, createWorkflowFromGoal, advanceWorkflowStage, executeWorkflowStage,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompanyData(): CompanyData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCompanyData must be used within CompanyDataProvider');
  return ctx;
}
