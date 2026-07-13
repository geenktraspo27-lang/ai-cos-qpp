import type { Kpi, StrategicGoal } from '../types';

/** Ported from Component.prototype.GOALS / KPIS. Defaults before any founder edits. */
export const DEFAULT_VISION =
  '「人とAIが共に働く、次世代の企業インフラを日本から創る」';

export const DEFAULT_GOALS: StrategicGoal[] = [
  { name: '国内エンタープライズ導入 50社', pct: 68, owner: 'nova' },
  { name: 'AI社員による業務自動化率 40%', pct: 52, owner: 'orbit' },
  { name: 'ナレッジベース網羅率 90%', pct: 81, owner: 'atlas' },
];

export const DEFAULT_KPIS: Kpi[] = [
  { label: 'MRR', value: '¥42.8M', delta: '+12.4%', good: true },
  { label: '自動化タスク / 週', value: '1,284', delta: '+8.1%', good: true },
  { label: '意思決定リードタイム', value: '1.6日', delta: '-31%', good: true },
  { label: 'ナレッジ検索ヒット率', value: '93%', delta: '+4pt', good: true },
];

export const MISSION_PROGRESS_PCT = 67;
