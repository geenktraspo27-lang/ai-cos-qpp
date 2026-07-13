# AI・COS — AI Company Operating System

「AI社員が働く本社ビルに入る体験」を提供する経営アプリ。

デザインの正本(コンセプト・8名のAI社員・部屋構成・デザイントークン)は
[geenktraspo27-lang/ai-cos-v1](https://github.com/geenktraspo27-lang/ai-cos-v1)
の design pack (`design_handoff_ai_cos_hq/README.md`) を参照。このリポジトリはその
デザインリファレンスを Vite + React + TypeScript + Supabase で実装したアプリ本体。

`design_handoff_ai_cos_hq/prototype/*.dc.html` や `reference/*.jsx` は見た目・挙動を
確認するためのプロトタイプであり、このリポジトリのコードへそのままコピーしていない
(構造・スタイルは CSS Modules / React コンポーネントとして作り直している)。

## 現在の実装範囲

**フロントエンド(全9画面)**
- Lobby(アトリウム案)、Mission Room、Decision Room(議論スレッド付き)、
  Finance / Brain / Marketing / Workflow / Documentation / AI Employee Room
- 共通シェル:Header、FloorNav、EmployeePanel、入室トランジション、トースト、
  モバイルドロワー / FAB

**バックエンド**
- Supabase(Postgres + Auth + RLS)によるマルチテナント設計。会社(テナント)ごとに
  データを分離し、サインアップ時に自動で会社作成 + デモデータ投入
- メール/パスワードでのサインアップ・ログイン・ログアウト

**未実装(今後のフェーズ)**
- 実際のAI社員LLM連携(現状はサインアップ時に投入される静的なデモデータ)
- Stripeによるサブスクリプション課金
- 本番デプロイ・監視・自動テスト

## 技術構成

- **フレームワーク**: Vite + React + TypeScript
- **バックエンド**: Supabase(Postgres / Auth / Row Level Security)。ホスティングは Vercel を想定
- **状態管理**: React 標準(useState / Context)。グローバル化が必要になれば Zustand を想定
- **スタイリング**: `src/styles/tokens.css` の CSS変数(design pack README §6 のトークン)+
  コンポーネント単位の CSS Modules
- **永続化**: Mission Room の編集項目(Vision/Goals/KPI)は Supabase に保存。
  `src/lib/store.ts` はブラウザローカルな一時状態向けの薄い localStorage 抽象として残置

## セットアップ

初回は [`docs/setup-supabase-vercel.md`](docs/setup-supabase-vercel.md) の手順で
Supabase プロジェクトを作成し、`.env` を用意してください。

```bash
cp .env.example .env   # SupabaseのURL/anonキーを設定
npm install
npm run dev      # 開発サーバー
npm run build    # 本番ビルド(tsc -b && vite build)
npm run lint      # oxlint
```

## ディレクトリ構成

```
src/
  components/   Header, FloorNav, EmployeePanel, Face, Ring, RoomShell, Toast など共通部品
  rooms/        Auth, Lobby, Mission, Decision, Finance, Brain, Marketing, Workflow,
                Documentation, EmployeeRoom(画面ごと)
  state/        AppContext(現在の部屋・選択社員・ドロワー等), AuthContext, useTasks
  data/         社員・部屋などのモックデータ(型付き。デモ会社の初期データにも対応)
  lib/          supabase.ts(クライアント), auth.ts, store.ts(localStorage抽象), usePersistedState
  styles/       tokens.css(デザイントークン・キーフレーム)
  types/        共通型定義, database.ts(Supabaseスキーマ型)
public/assets/  社員ポートレート・本社ビジュアル(デザインの正だが本番最終アセットではない)
supabase/
  migrations/   スキーマ・RLSポリシー・新規サインアップ時のシード関数
  seed.sql      8名のAI社員ロースター(固定・共有データ)
docs/
  setup-supabase-vercel.md   Supabase/Vercelのセットアップ手順(ユーザー操作分)
```
