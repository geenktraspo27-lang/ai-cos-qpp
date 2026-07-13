import type { Campaign, Kpi } from '../types';

/** Ported from Component.prototype.BRAND_KPIS / CAMPAIGNS + the inline auroraInsights literal. */
export const BRAND_KPIS: Kpi[] = [
  { label: 'ブランド認知度', value: '34%', delta: '+6pt', good: true },
  { label: 'NPS', value: '42', delta: '+5', good: true },
  { label: 'SNSフォロワー', value: '28.4K', delta: '+12%', good: true },
  { label: '新規リード / 月', value: '312', delta: '+9%', good: true },
];

export const CAMPAIGNS: Campaign[] = [
  { name: 'エンタープライズ導入事例キャンペーン', status: '配信中', pct: 72 },
  { name: 'AI社員ブランドムービー第2弾', status: '準備中', pct: 35 },
  { name: '展示会「Future of Work 2026」出展', status: '分析中', pct: 100 },
];

export const campaignStatusColor = (status: string): string => {
  if (status === '配信中') return '#3FA45B';
  if (status === '準備中') return '#C7823B';
  return '#2E7CD6';
};

export const AURORA_INSIGHTS: string[] = [
  '導入事例コンテンツの反応が好調。エンタープライズ層のリード獲得単価が前月比 -18% に改善しました。',
  '競合A社が中小企業向けに価格改定。当社はエンタープライズ特化の訴求を強めるのが有効です。',
  '東南アジア展開が承認されれば、現地パートナーとの共同ウェビナーを最初の施策として提案します。',
];
