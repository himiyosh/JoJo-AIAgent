import { ref } from 'vue'

export interface GlossaryEntry {
  id: string
  term: string
  en?: string
  short: string
}

/** Single source of truth for the 用語集 (Glossary). `id` doubles as the
 *  `data-term` value used by inline `.gterm` links and the `#g-<id>` anchor. */
export const GLOSSARY: GlossaryEntry[] = [
  { id: 'prompt-engineering', term: 'プロンプトエンジニアリング', en: 'Prompt Eng.',
    short: '指示文の言い方を工夫して、欲しい答えを引き出す技術。すべての土台。' },
  { id: 'context-engineering', term: 'コンテキストエンジニアリング', en: 'Context Eng.',
    short: '適切な情報とツールを・適切な形式とタイミングで文脈窓に入れる設計。' },
  { id: 'harness', term: 'ハーネス', en: 'Harness',
    short: '素のモデルを実際に動かす周辺コード（実行・パース・リトライ・ガードレール・文脈組立）。' },
  { id: 'loop', term: 'エージェントループ', en: 'Agentic Loop',
    short: '知覚→思考→行動→観察を、終了条件まで自律的に反復する制御構造。' },
  { id: 'rag', term: 'RAG', en: 'Retrieval-Augmented Generation',
    short: '外部の知識を検索してプロンプトに足し、最新・専門情報で回答精度を上げる手法。' },
  { id: 'few-shot', term: 'Few-shot', en: '少数例提示',
    short: 'プロンプトにお手本を数個入れ、形式や解き方を真似させる。0個ならZero-shot。' },
  { id: 'system-prompt', term: 'システムプロンプト', en: 'System Prompt',
    short: '役割・方針・制約など、会話の土台としてモデルに与える指示。' },
  { id: 'cot', term: 'Chain-of-Thought', en: 'CoT・思考の連鎖',
    short: '「順を追って考えて」と促し、途中の推論を出させて多段推論の精度を上げる。' },
  { id: 'context-window', term: '文脈窓', en: 'Context Window',
    short: 'モデルが一度に読める入力の上限（トークン数）。有限なので取捨選択が肝。' },
  { id: 'token', term: 'トークン', en: 'Token',
    short: 'モデルが扱う文字の最小単位。料金や文脈の長さはトークン数で数える。' },
  { id: 'mcp', term: 'MCP', en: 'Model Context Protocol',
    short: 'モデルと外部ツール・データを繋ぐ“共通プラグ”の標準規格（Anthropic 提唱）。' },
  { id: 'agent', term: 'エージェント', en: 'Agent',
    short: 'モデルに足場（ツール・記憶・ループ）を与え、自律的に多段タスクをこなす仕組み。' },
  { id: 'reflection', term: 'リフレクション', en: '自己点検 / Reflexion',
    short: '出力を自分で振り返り、誤りを直してから次へ進む手法（Reflexion が代表）。' },
  { id: 'guardrails', term: 'ガードレール', en: 'Guardrails',
    short: '暴走・逸脱・危険操作を防ぐ制約や検査（権限・ポリシー・出力検証など）。' },
  { id: 'orchestration', term: 'オーケストレーション', en: 'Orchestration',
    short: '複数ステップ・ツール・エージェントの段取りを組み、文脈を組み立てて統制すること。' },
  { id: 'tool-calling', term: 'ツール呼び出し', en: 'Function Calling',
    short: 'モデルが構造化された形式で外部機能を呼び出し、結果を受け取る仕組み。' },
  { id: 'react', term: 'ReAct', en: 'Reason + Act',
    short: '推論(Reason)と行動(Act)を交互に繰り返す、エージェントの基本パターン（Yao+ 2022）。' },
  { id: 'multi-agent', term: 'マルチエージェント', en: 'Multi-agent',
    short: '役割を分けた複数のエージェントが協調して1つのタスクを解く構成。対義は単一エージェント。' },
  { id: 'graph-engineering', term: 'グラフエンジニアリング', en: 'Graph Engineering（未確定）',
    short: '2026年7月に急浮上した呼び名。複数のLoop・Tool・Humanをnode／edge／stateで束ねる設計、と暫定的に整理される。標準化された定義はまだ無い。' },
]

/** id of the term to highlight on the Glossary slide (set when a `.gterm` link is clicked). */
export const activeTerm = ref<string | null>(null)
/** bumped on every jump so re-clicking the same term re-triggers the highlight animation. */
export const termHits = ref(0)
/** slide number to return to via the 戻る button on the Glossary slide. */
export const originPage = ref<number | null>(null)

/** valid term ids — used to ignore stray `data-term` values. */
export const TERM_IDS = new Set(GLOSSARY.map(g => g.id))
