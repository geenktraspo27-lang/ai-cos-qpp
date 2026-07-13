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
      ]);

      if (cancelled) return;

      const firstError =
        visionRes.error || goalsRes.error || kpisRes.error || notificationsRes.error ||
        feedRes.error || employeeStateRes.error || tasksRes.error ||
        workflowsCountRes.error || pendingDecisionsCountRes.error;
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
    }),
    [
      loading, error, vision, visionProgressPct, goals, kpis, notifications, feed,
      employeeStates, tasksByEmployee, activeWorkflowsCount, pendingDecisionsCount,
      refetch, updateVision, addGoal, updateGoal,
      removeGoal, addKpi, updateKpi, removeKpi, addTask, updateTask, removeTask,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompanyData(): CompanyData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCompanyData must be used within CompanyDataProvider');
  return ctx;
}
