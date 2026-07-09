<script setup lang="ts">
import RevealTabs, { type RevealItem } from './RevealTabs.vue'

const multiSrc = [
  { label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
  { label: 'Anthropic — Multi-agent System', url: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
]

const options: RevealItem[] = [
  {
    key: '単一エージェント', no: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/></svg>', tag: 'Single', sub: '1体に多くの道具',
    head: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/></svg> <em>単一エージェント</em> <span class="rt__en">Single</span>',
    lead: '1体のエージェントに <strong>多くの道具</strong> を持たせる。',
    pros: ['＋ シンプル / 速い / 安い', '＋ 文脈を共有・デバッグが楽'],
    cons: ['－ 道具が増える(10〜20+)と混乱', '－ プロンプト・文脈が肥大化'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v8.5H4.6a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1Z"/><path d="M7 11 11 4.2a1.9 1.9 0 0 1 2 1.5l-.7 4.1h6.2a1.9 1.9 0 0 1 1.9 2.3l-1.2 5.8A2 2 0 0 1 17.3 19.5H7"/></svg> 向いている場面', body: 'タスクが <strong>ひとまとまり</strong> ／ 道具が <strong>少ない</strong> ／ <span class="whitespace-nowrap">速さ・コスト重視</span>' },
    sources: multiSrc,
  },
  {
    key: 'マルチ', no: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.4 19.2a5.6 5.6 0 0 1 11.2 0"/><path d="M16.2 5.2a3 3 0 0 1 0 5.6"/><path d="M17.8 19.2a5.6 5.6 0 0 0-2.8-4.8"/></svg>', tag: 'サブエージェント', sub: '役割ごとに分けて連携',
    head: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.4 19.2a5.6 5.6 0 0 1 11.2 0"/><path d="M16.2 5.2a3 3 0 0 1 0 5.6"/><path d="M17.8 19.2a5.6 5.6 0 0 0-2.8-4.8"/></svg> <em>マルチエージェント</em> <span class="rt__en">Multi</span>',
    lead: '役割ごとに <strong>分けて連携</strong> させる。',
    pros: ['＋ 専門特化・並列で速い', '＋ 関心を分離・役割ごとに別モデル可'],
    cons: ['－ 調整コスト・呼び出し増（高コスト）', '－ 受け渡し・デバッグが難しい'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v8.5H4.6a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1Z"/><path d="M7 11 11 4.2a1.9 1.9 0 0 1 2 1.5l-.7 4.1h6.2a1.9 1.9 0 0 1 1.9 2.3l-1.2 5.8A2 2 0 0 1 17.3 19.5H7"/></svg> 向いている場面', body: 'スキル領域が <strong>明確に違う</strong> ／ <strong>並列</strong>で進む ／ <span class="whitespace-nowrap">道具が多すぎて混乱</span>' },
    sources: multiSrc,
  },
]
</script>

<template>
  <RevealTabs :items="options" variant="pair" aria-label="単一エージェント か マルチか（選んで詳細）" />
</template>
