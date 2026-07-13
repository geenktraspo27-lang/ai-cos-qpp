import type { FeedItem, NotificationItem, Vitals } from '../types';

/** Ported from Component.prototype.FEED_BASE / NOTIFS and the lobby `vitals` literal. */
export const VITALS: Vitals[] = [
  { k: 'ミッション進捗', v: '67%' },
  { k: '稼働中ワークフロー', v: '3件' },
  { k: '承認待ちの意思決定', v: '3件' },
  { k: 'AI社員 稼働率', v: '100%' },
];

export const COMPANY_HEALTH_PCT = 87;

export const FEED_BASE: FeedItem[] = [
  { by: 'orbit', text: '本日の優先タスク 12件を各部門に割当', t: '09:02' },
  { by: 'atlas', text: 'KPIダッシュボードを最新データで更新', t: '09:15' },
  { by: 'nova', text: '経営方針ドラフト v2 を作成', t: '09:31' },
  { by: 'milo', text: 'げんきさんの今日の予定をブリーフィング準備', t: '09:47' },
  { by: 'aurora', text: '競合3社のキャンペーンを検知・分析', t: '10:03' },
  {
    by: 'orbit',
    text: 'Atlas に東南アジア市場データの分析を依頼 → 完了報告を受領',
    t: '10:18',
  },
];

export const NOTIFS: NotificationItem[] = [
  {
    by: 'aurora',
    text: '東南アジア展開の判断をお待ちしています',
    t: '10:03',
    room: 'decision',
    unread: true,
  },
  {
    by: 'sage',
    text: 'コスト最適化レポートを更新しました',
    t: '09:41',
    room: 'finance',
    unread: true,
  },
  {
    by: 'nova',
    text: '経営方針ドラフト v2 のレビュー依頼',
    t: '09:31',
    room: 'docs',
    unread: true,
  },
  {
    by: 'atlas',
    text: 'KPIダッシュボードを更新しました',
    t: '09:15',
    room: 'mission',
    unread: false,
  },
];
