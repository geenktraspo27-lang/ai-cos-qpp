# セットアップ手順: Supabase + Vercel

このドキュメントは、Claude(このリポジトリの実装者)ではなく**ユーザー自身が行う必要がある**手順です。アカウント作成・課金情報・APIキーの発行はAIエージェントには実行できません。

## 1. Supabaseプロジェクトの作成

1. https://supabase.com/dashboard でアカウント作成 → 「New Project」
2. Organization / Project name(例: `ai-cos`)/ Database Password / Region(東京 `ap-northeast-1` 推奨)を設定して作成
3. プロジェクト作成完了まで数分待つ

## 2. マイグレーションの適用

ローカルに `supabase` CLI をインストール済みなら、リポジトリルートで:

```bash
supabase login
supabase link --project-ref <your-project-ref>   # Project Settings > General に表示されるref
supabase db push                                  # supabase/migrations/*.sql を適用
```

CLIを使わない場合は、Supabase Dashboard の **SQL Editor** で以下を「この順番で」実行:

1. `supabase/migrations/20260713000001_schema.sql`
2. `supabase/migrations/20260713000002_rls.sql`
3. `supabase/migrations/20260713000003_seed_company_defaults.sql`
4. `supabase/migrations/20260713000004_handle_new_user.sql`
5. `supabase/seed.sql`(8名のAI社員ロースター — 固定データ)

> 注: このリポジトリの開発環境ではDocker経由のレジストリアクセスがネットワークポリシーでブロックされていたため、`supabase start` によるフルスタックのローカル起動・検証はできませんでした。代わりに、生の PostgreSQL 16 に対して全マイグレーション適用・RLSのテナント分離・サインアップトリガーからのシードデータ投入(全24テーブルの件数一致)まで実地検証済みです。実プロジェクトへの適用時に問題が出た場合は、まずSQL Editorのエラーメッセージを確認してください。

## 3. APIキーの取得

Supabase Dashboard → Project Settings → API から:

- `Project URL` → `.env` の `VITE_SUPABASE_URL`
- `anon public` key → `.env` の `VITE_SUPABASE_ANON_KEY`

リポジトリルートで:

```bash
cp .env.example .env
# .env を開いて上記2値を貼り付け
```

`anon` キーはRLSで保護されている前提でクライアントに公開して問題ないキーです(`service_role` キーは絶対にフロントエンドに含めないでください)。

## 4. メール認証設定(サインアップ確認メール)

Authentication → Providers → Email で、開発中は「Confirm email」をオフにしておくと確認メールなしで即ログインでき動作確認が楽です。本番では有効化を推奨します。

Authentication → URL Configuration で `Site URL` を実際のデプロイ先URL(Vercelのドメイン確定後)に設定してください。

## 5. ローカルでの動作確認

```bash
npm install
npm run dev
```

`http://localhost:5173` で新規登録すると、DBトリガー(`handle_new_user`)が会社・プロフィール・デモデータ一式を自動作成します。

## 6. Vercelへのデプロイ

1. https://vercel.com でこのGitHubリポジトリ(`ai-cos-qpp`)をImport
2. Framework Preset: `Vite` を選択(自動検出されるはず)
3. Environment Variables に `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を設定(Production/Preview両方)
4. Deploy

デプロイ後のドメインが確定したら、Supabase側の `Site URL` / `Redirect URLs` も忘れずに更新してください。

## 今後(このドキュメントが対象外の範囲)

- 実際のAI社員LLM連携(Claude API呼び出し、Supabase Edge Functions)
- Stripeによるサブスクリプション決済
- 本番用ドメイン・SSL・監視ツールの設定

これらは別フェーズで対応します。
