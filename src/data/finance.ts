import type { Contract, FinCost, Kpi } from '../types';

/** Ported from Component.prototype.FIN_KPIS / FIN_COSTS / CONTRACTS. */
export const BUDGET_EXEC_PCT = 62;

export const FIN_KPIS: Pick<Kpi, 'label' | 'value'>[] = [
  { label: '現預金', value: '¥186M' },
  { label: 'ランウェイ', value: '22ヶ月' },
  { label: '月間バーン', value: '¥8.4M' },
  { label: '粗利率', value: '71%' },
];

export const FIN_COSTS: FinCost[] = [
  { dept: '開発・AI CORE', pct: 42, color: '#3D7BC7' },
  { dept: 'オペレーション', pct: 23, color: '#2C4A73' },
  { dept: 'マーケティング', pct: 18, color: '#E56A9A' },
  { dept: '管理・その他', pct: 17, color: '#8A6238' },
];

export const CONTRACTS: Contract[] = [
  { name: 'クラウドインフラ契約', due: '8/15', note: '更新時に年間 -12% の交渉余地あり' },
  { name: 'オフィス賃貸契約', due: '9/1', note: '現条件で自動更新予定' },
  { name: 'データプロバイダ契約', due: '9/20', note: '利用量ベースへの切替を推奨' },
];

export const SAGE_SUGGESTION =
  'Q3のコストは予算比 -4% で推移しています。クラウドインフラ契約の更新交渉で年間約 ¥1.2M の削減余地があります。浮いた予算はカスタマーサポートAI社員の増設(Decision Roomで承認待ち)に充当するのが最も投資効率が高いと分析しています。';
