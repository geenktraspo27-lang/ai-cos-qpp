import type { EmployeeId, Floor, RoomId } from '../types';

/** Ported from Component.prototype.FLOORS / ROOM_HOSTS / ROOM_DESC. */
export const FLOORS: Floor[] = [
  {
    id: 'exec',
    label: 'Executive Center',
    rooms: [
      { id: 'decision', name: 'Decision Room', jp: 'ディシジョンルーム' },
      { id: 'finance', name: 'Finance Room', jp: 'ファイナンスルーム' },
    ],
  },
  {
    id: 'intel',
    label: 'Intelligence Floor',
    rooms: [
      { id: 'brain', name: 'Brain Room', jp: 'ブレインルーム' },
      { id: 'marketing', name: 'Marketing Room', jp: 'マーケティングルーム' },
    ],
  },
  {
    id: 'ops',
    label: 'Operations Floor',
    rooms: [
      { id: 'mission', name: 'Mission Room', jp: 'ミッションルーム' },
      { id: 'workflow', name: 'Workflow Room', jp: 'ワークフロールーム' },
      { id: 'docs', name: 'Documentation Room', jp: 'ドキュメントルーム' },
    ],
  },
  {
    id: 'aiemp',
    label: 'AI Employee Floor',
    rooms: [{ id: 'employee', name: 'AI Employee Room', jp: 'AI社員ルーム' }],
  },
];

export const ROOM_HOSTS: Record<Exclude<RoomId, 'lobby'>, EmployeeId> = {
  mission: 'nova',
  decision: 'milo',
  finance: 'sage',
  brain: 'echo',
  marketing: 'aurora',
  workflow: 'orbit',
  docs: 'atlas',
  employee: 'luna',
};

export const ROOM_DESC: Record<Exclude<RoomId, 'lobby'>, string> = {
  mission: '経営戦略室 — 会社のビジョンと戦略目標を俯瞰する',
  decision: 'CEO決裁室 — AI社員の提言をもとに、あなたが最終判断を下す',
  finance: '財務戦略室 — 予算・コスト・キャッシュを Sage が管理する',
  brain: 'AIリサーチラボ — 会社の知性とアイデアが集まる場所',
  marketing: 'ブランド&マーケティング — Aurora が市場との接点をつくる',
  workflow: 'オペレーション管制センター — 稼働中のプロセスを監視する',
  docs: '会社の記憶 — Atlas が整理するナレッジベース',
  employee: '未来のHR部門 — AI社員たちのプロフィールと稼働状況',
};

export const ALL_ROOMS = FLOORS.flatMap((f) =>
  f.rooms.map((r) => ({ ...r, floorLabel: f.label })),
);

export const roomFloorLabel = (id: RoomId): string =>
  ALL_ROOMS.find((r) => r.id === id)?.floorLabel ?? '';
