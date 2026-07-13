import type { Workflow } from '../types';

/** Ported from Component.prototype.WORKFLOWS. */
export const WORKFLOWS: Workflow[] = [
  {
    name: '月次経営レポート生成',
    owner: 'atlas',
    pct: 78,
    stages: ['データ収集', '分析', 'ドラフト', 'レビュー', '配信'],
    current: 2,
  },
  {
    name: '新規リード評価パイプライン',
    owner: 'aurora',
    pct: 45,
    stages: ['取込', 'スコアリング', '分類', '担当割当'],
    current: 1,
  },
  {
    name: 'ナレッジ自動アーカイブ',
    owner: 'milo',
    pct: 92,
    stages: ['収集', 'タグ付け', '要約', '格納'],
    current: 3,
  },
];
