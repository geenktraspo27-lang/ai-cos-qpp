-- Fixed 8-employee roster shared by every company. Not company-scoped;
-- README §5: character roster (animal/role/key color) must not change.
insert into public.employees (id, name, jp, animal, color, role, role_jp, img, persona) values
  ('nova', 'Nova', 'ノヴァ', 'キツネ', '#E8842C', 'CEO', '最高経営責任者', '/assets/employees/nova.jpg', 'ビジョンと意思決定を司るリーダー。明るく前向きな性格。'),
  ('echo', 'Echo', 'エコー', 'オオカミ', '#3D7BC7', 'CTO', '最高技術責任者', '/assets/employees/echo.jpg', '技術戦略と研究開発をリード。冷静で知的、探究心が強い。'),
  ('sage', 'Sage', 'セージ', 'ネコ', '#3FA45B', 'CFO', '最高財務責任者', '/assets/employees/sage.jpg', '財務戦略・予算を管理。堅実で分析力に優れる。'),
  ('aurora', 'Aurora', 'オーロラ', 'ウサギ', '#E56A9A', 'CMO', '最高マーケティング責任者', '/assets/employees/aurora.jpg', 'ブランドとコミュニケーションを担当。創造的で人を惹きつける。'),
  ('orbit', 'Orbit', 'オービット', 'アライグマ', '#2C4A73', 'COO', '最高執行責任者', '/assets/employees/orbit.jpg', 'オペレーション全体を最適化。効率重視で実行力が高い。'),
  ('milo', 'Milo', 'マイロ', 'カワウソ', '#8B5FC7', 'AI Assistant', 'AIアシスタント', '/assets/employees/milo.jpg', 'AI社員のサポートとタスク支援。親しみやすく丁寧。'),
  ('atlas', 'Atlas', 'アトラス', 'フクロウ', '#8A6238', 'Data Analyst', 'データアナリスト', '/assets/employees/atlas.jpg', 'データ分析とナレッジ管理。冷静で情報に強い。'),
  ('luna', 'Luna', 'ルナ', 'シカ', '#7C6BAE', 'HR Manager', '人事マネージャー', '/assets/employees/luna.jpg', '人材と組織文化を育てる。思いやりがあり信頼される。')
on conflict (id) do nothing;
