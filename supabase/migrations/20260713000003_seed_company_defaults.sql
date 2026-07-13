-- Seeds a newly created company with the same starter content the frontend
-- previously shipped as hardcoded mock data (src/data/*.ts), so a brand new
-- signup sees a populated demo company on first login instead of an empty one.
create or replace function public.seed_company_defaults(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d1 uuid;
  d2 uuid;
  d3 uuid;
begin
  insert into public.employee_state (company_id, employee_id, activity, perf, done, rec) values
    (p_company_id, 'nova', '経営方針のドラフトを作成中', 97, 284, '経営方針ドラフト v2 のレビューをお願いできますか?Decision Roomに3件の承認待ちもあります。'),
    (p_company_id, 'echo', '技術ロードマップを検討中', 95, 231, 'レガシー文書システムの移行が81%完了。技術的リスクは想定内です。'),
    (p_company_id, 'sage', '予算計画をレビュー中', 96, 318, 'Q3のコストが予算比 -4%。浮いた予算のAI社員増設への振り分けを提案します。'),
    (p_company_id, 'aurora', '新ブランド施策を企画中', 93, 205, '東南アジア展開のパイロット案、Decision Roomでお待ちしています!'),
    (p_company_id, 'orbit', '全社オペレーションを最適化中', 98, 342, 'リード評価ワークフローに遅延傾向。自動割当ルールの追加を推奨します。'),
    (p_company_id, 'milo', '各AI社員のタスクをサポート中', 94, 412, '今日の予定を音声ブリーフィングでお伝えしましょうか?'),
    (p_company_id, 'atlas', 'データ分析レポートを作成中', 96, 296, 'ナレッジ網羅率が81%に到達。90%達成は来月中旬の見込みです。'),
    (p_company_id, 'luna', '組織カルチャー施策を検討中', 95, 188, 'AI社員全員のコンディションは良好です。Miloの完了タスクが今月最多でした!');

  insert into public.tasks (company_id, employee_id, text, position) values
    (p_company_id, 'nova', 'FY2026 経営方針ドラフト', 0),
    (p_company_id, 'nova', '四半期全社ミーティング準備', 1),
    (p_company_id, 'nova', '重要意思決定 3件のとりまとめ', 2),
    (p_company_id, 'echo', '技術ロードマップ v3 更新', 0),
    (p_company_id, 'echo', 'レガシーシステム移行計画', 1),
    (p_company_id, 'echo', 'AI CORE 稼働レポート', 2),
    (p_company_id, 'sage', 'Q3 予算実績レビュー', 0),
    (p_company_id, 'sage', 'コスト最適化の提案書', 1),
    (p_company_id, 'sage', '月次経営レポートの財務章', 2),
    (p_company_id, 'aurora', '東南アジア市場の分析', 0),
    (p_company_id, 'aurora', '新キャンペーン企画 2件', 1),
    (p_company_id, 'aurora', '顧客インタビュー要約', 2),
    (p_company_id, 'orbit', '週次リソース配分の最適化', 0),
    (p_company_id, 'orbit', 'ワークフロー遅延の解消', 1),
    (p_company_id, 'orbit', '部門間の優先度調整', 2),
    (p_company_id, 'milo', 'タスク割当の調整', 0),
    (p_company_id, 'milo', '会議メモの整理', 1),
    (p_company_id, 'milo', 'ファウンダー向けリマインド', 2),
    (p_company_id, 'atlas', 'KPIダッシュボード更新', 0),
    (p_company_id, 'atlas', 'ナレッジベース網羅率の集計', 1),
    (p_company_id, 'atlas', '市場データの週次分析', 2),
    (p_company_id, 'luna', 'AI社員パフォーマンスレビュー', 0),
    (p_company_id, 'luna', 'オンボーディング資料更新', 1),
    (p_company_id, 'luna', '1on1 スケジュール調整', 2);

  insert into public.company_vision (company_id, text, progress_pct) values
    (p_company_id, '「人とAIが共に働く、次世代の企業インフラを日本から創る」', 67);

  insert into public.goals (company_id, name, pct, owner_employee_id, position) values
    (p_company_id, '国内エンタープライズ導入 50社', 68, 'nova', 0),
    (p_company_id, 'AI社員による業務自動化率 40%', 52, 'orbit', 1),
    (p_company_id, 'ナレッジベース網羅率 90%', 81, 'atlas', 2);

  insert into public.kpis (company_id, label, value, delta, good, position) values
    (p_company_id, 'MRR', '¥42.8M', '+12.4%', true, 0),
    (p_company_id, '自動化タスク / 週', '1,284', '+8.1%', true, 1),
    (p_company_id, '意思決定リードタイム', '1.6日', '-31%', true, 2),
    (p_company_id, 'ナレッジ検索ヒット率', '93%', '+4pt', true, 3);

  insert into public.decisions (company_id, title, rec, risk, by_employee_id, detail)
    values (p_company_id, '東南アジア市場への展開判断', '推奨: 6ヶ月のパイロット展開', '中', 'aurora',
      'Auroraの市場分析では、シンガポール市場のTAMは3年で2.4倍。初期投資を限定したパイロットが最適とOrbitも評価しています。')
    returning id into d1;
  insert into public.decision_messages (decision_id, employee_id, text, stance, position) values
    (d1, 'aurora', 'シンガポール市場のTAMが3年で2.4倍という分析結果が出ました。フル展開を提案します。', null, 0),
    (d1, 'orbit', 'オペレーション観点では、フル展開はサポート体制が追いつきません。まずはパイロット規模が現実的です。', 'dissent', 1),
    (d1, 'sage', '同意です。初期投資を限定したパイロットなら、財務的なダウンサイドも小さく抑えられます。', null, 2),
    (d1, 'aurora', '承知しました。6ヶ月のパイロット展開に修正します。成果次第でフル展開を再提案します。', 'revision', 3);
  insert into public.decision_contributors (decision_id, employee_id) values
    (d1, 'aurora'), (d1, 'orbit'), (d1, 'sage');

  insert into public.decisions (company_id, title, rec, risk, by_employee_id, detail)
    values (p_company_id, 'カスタマーサポートAI社員の増設', '推奨: 承認(ROI 8ヶ月で回収)', '低', 'orbit',
      '問い合わせ量が前四半期比+34%。Orbitの負荷分析に基づき、専任AI社員1名の追加を推奨します。')
    returning id into d2;
  insert into public.decision_messages (decision_id, employee_id, text, stance, position) values
    (d2, 'orbit', '問い合わせ量が前四半期比+34%で、既存メンバーの負荷が限界に近づいています。専任AI社員1名の増設を提案します。', null, 0),
    (d2, 'sage', '増設コストとROIを試算したところ、8ヶ月で回収可能です。財務上の懸念はありません。', null, 1),
    (d2, 'luna', 'オンボーディング期間も考慮に入れると、初月は既存メンバーとのペア対応が安全です。', 'dissent', 2),
    (d2, 'orbit', 'Lunaの提案を反映し、初月はペア対応・2ヶ月目から独立稼働という段階導入に修正します。', 'revision', 3);
  insert into public.decision_contributors (decision_id, employee_id) values
    (d2, 'orbit'), (d2, 'sage'), (d2, 'luna');

  insert into public.decisions (company_id, title, rec, risk, by_employee_id, detail)
    values (p_company_id, 'レガシー文書管理システムの廃止', '検討継続: 移行完了率 81% 待ち', '中', 'echo',
      'Echoの移行計画では残り19%に重要契約書を含みます。完全移行後の廃止をSageも推奨しています。')
    returning id into d3;
  insert into public.decision_messages (decision_id, employee_id, text, stance, position) values
    (d3, 'echo', '移行が81%完了しました。このペースなら来月中旬に完全移行できる見込みです。廃止スケジュールを確定したいです。', null, 0),
    (d3, 'atlas', '待ってください。残り19%に重要契約書が含まれています。廃止を先に決めるのはリスクがあります。', 'dissent', 1),
    (d3, 'echo', '確かにその通りです。廃止は完全移行の確認後に判断する形に変更します。', 'revision', 2),
    (d3, 'sage', 'コスト面では旧システムの並行稼働も許容範囲内です。安全側に倒す判断に賛成します。', null, 3);
  insert into public.decision_contributors (decision_id, employee_id) values
    (d3, 'echo'), (d3, 'atlas'), (d3, 'sage');

  insert into public.workflows (company_id, name, owner_employee_id, pct, stages, current_stage) values
    (p_company_id, '月次経営レポート生成', 'atlas', 78, '["データ収集","分析","ドラフト","レビュー","配信"]'::jsonb, 2),
    (p_company_id, '新規リード評価パイプライン', 'aurora', 45, '["取込","スコアリング","分類","担当割当"]'::jsonb, 1),
    (p_company_id, 'ナレッジ自動アーカイブ', 'milo', 92, '["収集","タグ付け","要約","格納"]'::jsonb, 3);

  insert into public.ideas (company_id, title, employee_id, tag, heat) values
    (p_company_id, 'AI社員間の自律協働プロトコル', 'echo', 'R&D', 92),
    (p_company_id, '顧客ヘルススコアの予測モデル', 'atlas', 'データ', 85),
    (p_company_id, '音声ブリーフィング機能', 'milo', 'UX', 64),
    (p_company_id, '新市場向けブランドストーリー', 'aurora', 'ブランド', 78),
    (p_company_id, 'AI社員の成長評価フレームワーク', 'luna', '組織', 71),
    (p_company_id, 'コスト自動最適化エンジン', 'sage', '財務', 68);

  insert into public.finance_summary (company_id, budget_exec_pct, suggestion) values
    (p_company_id, 62, 'Q3のコストは予算比 -4% で推移しています。クラウドインフラ契約の更新交渉で年間約 ¥1.2M の削減余地があります。浮いた予算はカスタマーサポートAI社員の増設(Decision Roomで承認待ち)に充当するのが最も投資効率が高いと分析しています。');

  insert into public.finance_kpis (company_id, label, value, position) values
    (p_company_id, '現預金', '¥186M', 0),
    (p_company_id, 'ランウェイ', '22ヶ月', 1),
    (p_company_id, '月間バーン', '¥8.4M', 2),
    (p_company_id, '粗利率', '71%', 3);

  insert into public.finance_costs (company_id, dept, pct, color, position) values
    (p_company_id, '開発・AI CORE', 42, '#3D7BC7', 0),
    (p_company_id, 'オペレーション', 23, '#2C4A73', 1),
    (p_company_id, 'マーケティング', 18, '#E56A9A', 2),
    (p_company_id, '管理・その他', 17, '#8A6238', 3);

  insert into public.contracts (company_id, name, due, note, position) values
    (p_company_id, 'クラウドインフラ契約', '8/15', '更新時に年間 -12% の交渉余地あり', 0),
    (p_company_id, 'オフィス賃貸契約', '9/1', '現条件で自動更新予定', 1),
    (p_company_id, 'データプロバイダ契約', '9/20', '利用量ベースへの切替を推奨', 2);

  insert into public.brand_kpis (company_id, label, value, delta, position) values
    (p_company_id, 'ブランド認知度', '34%', '+6pt', 0),
    (p_company_id, 'NPS', '42', '+5', 1),
    (p_company_id, 'SNSフォロワー', '28.4K', '+12%', 2),
    (p_company_id, '新規リード / 月', '312', '+9%', 3);

  insert into public.campaigns (company_id, name, status, pct, position) values
    (p_company_id, 'エンタープライズ導入事例キャンペーン', '配信中', 72, 0),
    (p_company_id, 'AI社員ブランドムービー第2弾', '準備中', 35, 1),
    (p_company_id, '展示会「Future of Work 2026」出展', '分析中', 100, 2);

  insert into public.market_insights (company_id, employee_id, text, position) values
    (p_company_id, 'aurora', '導入事例コンテンツの反応が好調。エンタープライズ層のリード獲得単価が前月比 -18% に改善しました。', 0),
    (p_company_id, 'aurora', '競合A社が中小企業向けに価格改定。当社はエンタープライズ特化の訴求を強めるのが有効です。', 1),
    (p_company_id, 'aurora', '東南アジア展開が承認されれば、現地パートナーとの共同ウェビナーを最初の施策として提案します。', 2);

  insert into public.documentation_summary (company_id, coverage_pct) values (p_company_id, 81);

  insert into public.documents (company_id, title, cat, employee_id, doc_date, summary) values
    (p_company_id, 'FY2026 経営方針ドラフト v2', '経営', 'nova', '7/12', '来期の重点3領域(エンタープライズ拡大・自動化率向上・組織文化)をまとめた方針書。'),
    (p_company_id, '全社定例 議事録(7月第2週)', '議事録', 'milo', '7/10', '各部門の進捗共有と決定事項3件。東南アジア展開の論点整理を含む。'),
    (p_company_id, 'AI社員オンボーディングガイド', 'マニュアル', 'luna', '7/8', '新しいAI社員を迎える際の役割定義・権限設定・初期タスクの手順書。'),
    (p_company_id, 'ワークフロー作成マニュアル v1.3', 'マニュアル', 'orbit', '7/5', '業務プロセスの分解・ステージ設計・AI社員への割当方法を解説。'),
    (p_company_id, '主要取引先 契約更新一覧', '契約', 'sage', '7/3', 'Q3に更新期限を迎える契約12件のサマリーとリスク評価。'),
    (p_company_id, '競合分析レポート(2026上期)', 'ナレッジ', 'aurora', '6/28', '国内外の競合5社のプロダクト・価格・市場ポジションの比較分析。'),
    (p_company_id, '技術ロードマップ v3', '経営', 'echo', '6/25', 'AI CORE の増強計画と、レガシーシステム移行のマイルストーン。'),
    (p_company_id, 'ナレッジベース運用ルール', 'ナレッジ', 'atlas', '6/20', 'ドキュメントの命名規則・タグ付け基準・アーカイブポリシー。');

  insert into public.notifications (company_id, employee_id, text, room, unread, created_at) values
    (p_company_id, 'aurora', '東南アジア展開の判断をお待ちしています', 'decision', true, now() - interval '17 minutes'),
    (p_company_id, 'sage', 'コスト最適化レポートを更新しました', 'finance', true, now() - interval '39 minutes'),
    (p_company_id, 'nova', '経営方針ドラフト v2 のレビュー依頼', 'docs', true, now() - interval '49 minutes'),
    (p_company_id, 'atlas', 'KPIダッシュボードを更新しました', 'mission', false, now() - interval '65 minutes');

  insert into public.activity_feed (company_id, employee_id, text, created_at) values
    (p_company_id, 'orbit', '本日の優先タスク 12件を各部門に割当', now() - interval '90 minutes'),
    (p_company_id, 'atlas', 'KPIダッシュボードを最新データで更新', now() - interval '77 minutes'),
    (p_company_id, 'nova', '経営方針ドラフト v2 を作成', now() - interval '61 minutes'),
    (p_company_id, 'milo', 'げんきさんの今日の予定をブリーフィング準備', now() - interval '45 minutes'),
    (p_company_id, 'aurora', '競合3社のキャンペーンを検知・分析', now() - interval '29 minutes'),
    (p_company_id, 'orbit', 'Atlas に東南アジア市場データの分析を依頼 → 完了報告を受領', now() - interval '14 minutes');

  insert into public.subscriptions (company_id, plan, status) values
    (p_company_id, 'trial', 'trialing');
end;
$$;
