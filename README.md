# AI・COS — AI Company Operating System

「AI社員が働く本社ビルに入る体験」を提供する経営アプリのフロントエンド実装。

デザインの正本（コンセプト・8名のAI社員・部屋構成・デザイントークン）は
[geenktraspo27-lang/ai-cos-v1](https://github.com/geenktraspo27-lang/ai-cos-v1)
の design pack (`design_handoff_ai_cos_hq/README.md`) を参照。このリポジトリはその
デザインリファレンスを Vite + React + TypeScript で実装したアプリ本体。

`design_handoff_ai_cos_hq/prototype/*.dc.html` や `reference/*.jsx` は見た目・挙動を
確認するためのプロトタイプであり、このリポジトリのコードへそのままコピーしていない
（構造・スタイルは CSS Modules / React コンポーネントとして作り直している）。

## 現在の実装範囲

- Lobby（アトリウム案）
- Mission Room（Vision / Strategic Goals / KPI・KDI、編集機能つき）
- 共通シェル：Header、FloorNav（左フロアナビ）、EmployeePanel（右AI社員パネル）、
  入室トランジション、トースト、モバイルドロワー / FAB
- 残り7室（Decision / Finance / Brain / Marketing / Workflow / Docs / AI Employee）は
  ナビゲーションから遷移可能な「Coming soon」プレースホルダーのみ

## 技術構成

- **フレームワーク**: Vite + React + TypeScript
- **状態管理**: React 標準（useState / Context）。グローバル化が必要になれば Zustand を想定
- **スタイリング**: `src/styles/tokens.css` の CSS変数（design pack README §6 のトークン）+
  コンポーネント単位の CSS Modules
- **永続化**: `src/lib/store.ts` の薄い抽象（`aicos_` プレフィックスの localStorage）。
  API 差し替えは `Persistence` インターフェースの実装を差し替えるだけで済む設計
- **データ**: `src/data/` 配下に `AI-COS.dc.html` の定数群（EMP / FLOORS / GOALS / KPIS など）
  を型付きで移植。将来の残り7室実装でもこのデータ層をそのまま拡張する想定

## セットアップ

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 本番ビルド（tsc -b && vite build）
npm run lint      # oxlint
```

## ディレクトリ構成

```
src/
  components/   Header, FloorNav, EmployeePanel, Face, Ring, RoomShell, Toast など共通部品
  rooms/        Lobby, Mission, ComingSoon（部屋ごとの画面）
  state/        AppContext（現在の部屋・選択社員・ドロワー等）, useTasks
  data/         社員・部屋・ミッション・ロビーのモックデータ（型付き）
  lib/          store.ts（永続化抽象）, usePersistedState
  styles/       tokens.css（デザイントークン・キーフレーム）
  types/        共通型定義
public/assets/  社員ポートレート・本社ビジュアル（デザインの正だが本番最終アセットではない）
```
