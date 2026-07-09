<script setup lang="ts">
import RevealTabs, { type RevealItem } from './RevealTabs.vue'

const steps: RevealItem[] = [
  {
    key: 'Prompt', no: '①', tag: '〜2023', sub: '指示を工夫する',
    head: 'Prompt Engineering ＝ <em>どう伝えるか</em>',
    lead: 'むかしは、<strong>指示文の工夫だけ</strong>でかなり戦えた。',
    points: [
      '<strong>役割(role)</strong>を与える：「プロの校正者として」',
      '<strong>出力形式</strong>を指定：「箇条書き3点で」',
      'お手本(<a class="gterm" data-term="few-shot"><strong>Few-shot</strong></a>)を見せる',
      '<strong>手順</strong>を促す：「<a class="gterm" data-term="cot">順を追って考えて</a>」',
    ],
    card: {
      title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.2A2.2 2.2 0 0 1 6.2 4h11.6A2.2 2.2 0 0 1 20 6.2v7.1a2.2 2.2 0 0 1-2.2 2.2H10l-4 3.2v-3.2H6.2A2.2 2.2 0 0 1 4 13.3z"/><path d="M8.5 9.7h7M8.5 12.4h4.5"/></svg> ねらい',
      body: 'モデルへの <strong>“言い方”</strong> を最適化して、<br>欲しい答えを引き出す',
      note: '今でも基礎であり必須。<br>ただし、これ “だけ” では足りなくなっていく…',
    },
    sources: [
      { label: 'OpenAI — Prompt Engineering', url: 'https://platform.openai.com/docs/guides/prompt-engineering' },
      { label: 'CoT (Wei+ 2022)', url: 'https://arxiv.org/abs/2201.11903' },
      { label: 'Few-Shot/GPT-3 (Brown+ 2020)', url: 'https://arxiv.org/abs/2005.14165' },
    ],
  },
  {
    key: 'Context', no: '②', tag: '2024–25', sub: '文脈を設計する',
    head: 'Context Engineering ＝ <em>何を知っているか</em>',
    lead: '<a class="gterm" data-term="context-window">文脈窓</a>に、<strong>適切な情報とツールを・<br>適切な形式とタイミングで</strong>入れる設計。',
    points: [
      '<a class="gterm" data-term="system-prompt"><strong>System Prompt</strong></a>（土台の指示）',
      '<a class="gterm" data-term="rag"><strong>RAG</strong></a> で関連資料を選ぶ',
      'メモリ・履歴から<strong>必要な分だけ</strong>',
      'ツールの結果を<strong>要約・圧縮</strong>',
    ],
    card: {
      title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 18h5.6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.4c.8.7 1.2 1.4 1.2 2.3v.3h5.6v-.3c0-.9.4-1.6 1.2-2.3A6 6 0 0 0 12 3Z"/></svg> なぜ大事',
      body: '窓は有限。<strong>詰め込みすぎ</strong>ると精度もコストも悪化。<br>“良い文脈づくり” が答えの質を決める。',
      note: 'プロンプト職人 → 「文脈の編集者」へ。<br>これが第一の大きな変化。',
    },
    sources: [
      { label: 'Anthropic — Context Engineering', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents' },
      { label: 'LangChain — Context Engineering', url: 'https://blog.langchain.com/context-engineering-for-agents/' },
      { label: 'Phil Schmid — Context Engineering', url: 'https://www.philschmid.de/context-engineering' },
    ],
  },
  {
    key: 'Harness', no: '③', tag: '2025–26', sub: '動かす足場を作る',
    head: 'Harness Engineering ＝ <em>どう動かすか</em>',
    lead: '素のモデルは「考える」だけ。<br><strong>実際に動く足場（<a class="gterm" data-term="harness">ハーネス</a>）</strong>が要る。',
    points: [
      'ツールを<strong>実行</strong>して結果を戻す',
      'モデル出力の<strong>パース</strong>（解釈）',
      '失敗時の<strong>リトライ</strong>',
      '暴走を防ぐ<a class="gterm" data-term="guardrails"><strong>ガードレール</strong></a>',
      '文脈の<strong>組み立て</strong>（<a class="gterm" data-term="orchestration">オーケストレーション</a>）',
    ],
    card: {
      title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21 6.6 5h10.8L19 21"/><path d="M6.2 9h11.6M5.6 15h12.8M9.6 5 8.4 21M14.4 5l1.2 16"/></svg> ひとことで',
      body: 'モデルを <strong>“エージェント化”</strong> する周辺コードの設計',
      note: 'ここが弱いと、賢いモデルでも実力を出せない。',
    },
    sources: [
      { label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
      { label: 'Anthropic — Effective Harnesses', url: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents' },
      { label: 'OpenAI — Building Agents (PDF)', url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf' },
    ],
  },
  {
    key: 'Loop', no: '④', tag: '2026〜', sub: '反復を制御する', now: true,
    head: 'Loop Engineering ＝ <em>どう反復するか</em>',
    lead: 'ループを<strong>賢く制御する</strong>ことが、長い作業の成否を分ける。',
    points: [
      'いつ<strong>続ける／止める</strong>か（終了条件）',
      '<strong>ステップ予算</strong>（無限ループ防止）',
      '<a class="gterm" data-term="reflection"><strong>リフレクション</strong></a>（自己点検して直す）',
      '<strong>エラー回復</strong>（失敗から立て直す）',
    ],
    card: {
      title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8"/><path d="M20 3.5V8h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16"/><path d="M4 20.5V16h4.5"/></svg> 昔とのちがい',
      body: '<strong>昔</strong>：指示文を変えれば良くなった<br><strong>いま</strong>：<span class="grad" style="font-weight:700">ループの設計</span>で品質が決まる',
      note: '“一言の工夫” から “段取りの設計” へ。',
    },
    sources: [
      { label: 'ReAct (Yao+ 2022)', url: 'https://arxiv.org/abs/2210.03629' },
      { label: 'Reflexion (Shinn+ 2023)', url: 'https://arxiv.org/abs/2303.11366' },
      { label: 'Lilian Weng — LLM Agents', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/' },
    ],
  },
]
</script>

<template>
  <RevealTabs :items="steps" variant="timeline" aria-label="作り方の進化（時代を選ぶ）" />
</template>
