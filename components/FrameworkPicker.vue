<script setup lang="ts">
import RevealTabs, { type RevealItem } from './RevealTabs.vue'

const frameworks: RevealItem[] = [
  {
    key: 'LangGraph', tag: 'グラフ／状態機械',
    head: '<em>LangGraph</em>',
    q: '本番・状態管理・監査が要る複雑な処理',
    lead: '途中状態を厳密に管理したい <strong>本番</strong> 用途に強い。',
    points: ['グラフ／状態機械でフローを定義', '途中状態の保存・再開・監査がしやすい'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4M15 3v4"/><path d="M7 7h10v2.5a5 5 0 0 1-10 0z"/><path d="M12 14.5V18a3 3 0 0 0 3 3h1.5"/></svg> MCP', body: '<strong><svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="m8.4 12.2 2.5 2.5 4.7-5.4"/></svg> 対応</strong>', note: 'アーキ: グラフ／状態機械' },
    source: { label: 'LangGraph docs', url: 'https://docs.langchain.com/oss/python/langgraph/overview' },
  },
  {
    key: 'CrewAI', tag: 'ロール／クルー',
    head: '<em>CrewAI</em>',
    q: '試作・役割分担チームを素早く',
    lead: '役割(ロール)を割り当てた <strong>チーム</strong> を素早く組める。',
    points: ['ロール分担で協調動作', 'プロトタイプ・検証向き'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4M15 3v4"/><path d="M7 7h10v2.5a5 5 0 0 1-10 0z"/><path d="M12 14.5V18a3 3 0 0 0 3 3h1.5"/></svg> MCP', body: '<strong><svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="m8.4 12.2 2.5 2.5 4.7-5.4"/></svg> 対応</strong>', note: 'アーキ: ロール／クルー' },
    source: { label: 'crewai.com', url: 'https://crewai.com/' },
  },
  {
    key: 'OpenAI Agents SDK', tag: '命令的ハーネス',
    head: '<em>OpenAI Agents SDK</em>',
    q: 'OpenAI 中心・ガードレール重視',
    lead: 'OpenAI 中心で、<strong>ガードレール</strong> を効かせたい構築に。',
    points: ['命令的に書けるハーネス', 'ガードレール機能が充実'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4M15 3v4"/><path d="M7 7h10v2.5a5 5 0 0 1-10 0z"/><path d="M12 14.5V18a3 3 0 0 0 3 3h1.5"/></svg> MCP', body: '<strong><svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="m8.4 12.2 2.5 2.5 4.7-5.4"/></svg> 対応</strong>', note: 'アーキ: 命令的ハーネス' },
    source: { label: 'OpenAI Agents SDK', url: 'https://openai.github.io/openai-agents-python/' },
  },
  {
    key: 'Microsoft Agent Framework', tag: 'AutoGen＋SK',
    head: '<em>Microsoft Agent Framework</em>',
    q: 'Azure／企業・統合運用',
    lead: '<strong>Azure・企業</strong> での統合運用に。',
    points: ['AutoGen ＋ Semantic Kernel を統合', 'エンタープライズ運用向け'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4M15 3v4"/><path d="M7 7h10v2.5a5 5 0 0 1-10 0z"/><path d="M12 14.5V18a3 3 0 0 0 3 3h1.5"/></svg> MCP', body: '<strong><svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="m8.4 12.2 2.5 2.5 4.7-5.4"/></svg> 対応</strong>', note: 'アーキ: AutoGen＋SK 統合' },
    source: { label: 'Microsoft Agent Framework', url: 'https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/' },
  },
  {
    key: 'Claude Agent SDK', tag: 'ハーネス',
    head: '<em>Claude Agent SDK</em>',
    q: 'Anthropic 中心の構築',
    lead: '<strong>Anthropic</strong> 中心でエージェントを組むなら。',
    points: ['Claude 向けのハーネス', 'Anthropic エコシステムと親和'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4M15 3v4"/><path d="M7 7h10v2.5a5 5 0 0 1-10 0z"/><path d="M12 14.5V18a3 3 0 0 0 3 3h1.5"/></svg> MCP', body: '<strong><svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="m8.4 12.2 2.5 2.5 4.7-5.4"/></svg> 対応</strong>', note: 'アーキ: ハーネス' },
    source: { label: 'Claude Agent SDK', url: 'https://code.claude.com/docs/en/agent-sdk/overview' },
  },
]
</script>

<template>
  <RevealTabs :items="frameworks" variant="row" aria-label="主要フレームワーク（選んで詳細）" />
</template>
