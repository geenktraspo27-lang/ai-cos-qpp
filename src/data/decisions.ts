import type { Decision } from '../types';

/**
 * Ported from Component.prototype.DECISIONS and extended per README §8
 * ("自律協働の表現原則" — 最重要差別化): each decision now carries a
 * discussion log showing how employees argued to a conclusion, including
 * at least one dissenting/revising voice, plus a contributors credit line.
 */
export const DECISIONS: Decision[] = [
  {
    id: 1,
    title: '東南アジア市場への展開判断',
    rec: '推奨: 6ヶ月のパイロット展開',
    risk: '中',
    by: 'aurora',
    detail:
      'Auroraの市場分析では、シンガポール市場のTAMは3年で2.4倍。初期投資を限定したパイロットが最適とOrbitも評価しています。',
    discussion: [
      { by: 'aurora', text: 'シンガポール市場のTAMが3年で2.4倍という分析結果が出ました。フル展開を提案します。' },
      { by: 'orbit', text: 'オペレーション観点では、フル展開はサポート体制が追いつきません。まずはパイロット規模が現実的です。', stance: 'dissent' },
      { by: 'sage', text: '同意です。初期投資を限定したパイロットなら、財務的なダウンサイドも小さく抑えられます。' },
      { by: 'aurora', text: '承知しました。6ヶ月のパイロット展開に修正します。成果次第でフル展開を再提案します。', stance: 'revision' },
    ],
    contributors: ['aurora', 'orbit', 'sage'],
  },
  {
    id: 2,
    title: 'カスタマーサポートAI社員の増設',
    rec: '推奨: 承認(ROI 8ヶ月で回収)',
    risk: '低',
    by: 'orbit',
    detail:
      '問い合わせ量が前四半期比+34%。Orbitの負荷分析に基づき、専任AI社員1名の追加を推奨します。',
    discussion: [
      { by: 'orbit', text: '問い合わせ量が前四半期比+34%で、既存メンバーの負荷が限界に近づいています。専任AI社員1名の増設を提案します。' },
      { by: 'sage', text: '増設コストとROIを試算したところ、8ヶ月で回収可能です。財務上の懸念はありません。' },
      { by: 'luna', text: 'オンボーディング期間も考慮に入れると、初月は既存メンバーとのペア対応が安全です。', stance: 'dissent' },
      { by: 'orbit', text: 'Lunaの提案を反映し、初月はペア対応・2ヶ月目から独立稼働という段階導入に修正します。', stance: 'revision' },
    ],
    contributors: ['orbit', 'sage', 'luna'],
  },
  {
    id: 3,
    title: 'レガシー文書管理システムの廃止',
    rec: '検討継続: 移行完了率 81% 待ち',
    risk: '中',
    by: 'echo',
    detail:
      'Echoの移行計画では残り19%に重要契約書を含みます。完全移行後の廃止をSageも推奨しています。',
    discussion: [
      { by: 'echo', text: '移行が81%完了しました。このペースなら来月中旬に完全移行できる見込みです。廃止スケジュールを確定したいです。' },
      { by: 'atlas', text: '待ってください。残り19%に重要契約書が含まれています。廃止を先に決めるのはリスクがあります。', stance: 'dissent' },
      { by: 'echo', text: '確かにその通りです。廃止は完全移行の確認後に判断する形に変更します。', stance: 'revision' },
      { by: 'sage', text: 'コスト面では旧システムの並行稼働も許容範囲内です。安全側に倒す判断に賛成します。' },
    ],
    contributors: ['echo', 'atlas', 'sage'],
  },
];
