import type { DocItem } from '../types';

/** Ported from Component.prototype.DOC_CATS / DOCS. */
export const DOC_COVERAGE_PCT = 81;

export const DOC_CATS: string[] = ['すべて', '経営', '議事録', 'マニュアル', '契約', 'ナレッジ'];

export const DOCS: DocItem[] = [
  {
    title: 'FY2026 経営方針ドラフト v2',
    cat: '経営',
    by: 'nova',
    date: '7/12',
    summary: '来期の重点3領域(エンタープライズ拡大・自動化率向上・組織文化)をまとめた方針書。',
  },
  {
    title: '全社定例 議事録(7月第2週)',
    cat: '議事録',
    by: 'milo',
    date: '7/10',
    summary: '各部門の進捗共有と決定事項3件。東南アジア展開の論点整理を含む。',
  },
  {
    title: 'AI社員オンボーディングガイド',
    cat: 'マニュアル',
    by: 'luna',
    date: '7/8',
    summary: '新しいAI社員を迎える際の役割定義・権限設定・初期タスクの手順書。',
  },
  {
    title: 'ワークフロー作成マニュアル v1.3',
    cat: 'マニュアル',
    by: 'orbit',
    date: '7/5',
    summary: '業務プロセスの分解・ステージ設計・AI社員への割当方法を解説。',
  },
  {
    title: '主要取引先 契約更新一覧',
    cat: '契約',
    by: 'sage',
    date: '7/3',
    summary: 'Q3に更新期限を迎える契約12件のサマリーとリスク評価。',
  },
  {
    title: '競合分析レポート(2026上期)',
    cat: 'ナレッジ',
    by: 'aurora',
    date: '6/28',
    summary: '国内外の競合5社のプロダクト・価格・市場ポジションの比較分析。',
  },
  {
    title: '技術ロードマップ v3',
    cat: '経営',
    by: 'echo',
    date: '6/25',
    summary: 'AI CORE の増強計画と、レガシーシステム移行のマイルストーン。',
  },
  {
    title: 'ナレッジベース運用ルール',
    cat: 'ナレッジ',
    by: 'atlas',
    date: '6/20',
    summary: 'ドキュメントの命名規則・タグ付け基準・アーカイブポリシー。',
  },
];
