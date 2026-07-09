<script setup lang="ts">
import RevealTabs, { type RevealItem } from './RevealTabs.vue'

const agentSrc = [
  { label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
  { label: 'Lilian Weng — LLM Agents', url: 'https://lilianweng.github.io/posts/2023-06-23-agent/' },
]

const traits: RevealItem[] = [
  {
    key: '自律性', no: '①', tag: 'Autonomy', sub: '次の一手を自分で決める',
    head: '<em>自律性</em> <span class="rt__en">Autonomy</span>',
    lead: '人が逐一指示しなくても、<strong>次の一手を自分で決める</strong>。',
    points: ['ゴールだけ渡せば段取りを組む', '状況を見て計画を修正する'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M16.2 7.8 13.4 13.4 7.8 16.2 10.6 10.6z"/></svg> イメージ', body: '「資料をまとめて」<br>→ 何を調べ、どの順で書くかを<strong>自分で判断</strong>' },
    sources: agentSrc,
  },
  {
    key: '目標志向', no: '②', tag: 'Goal-driven', sub: '結果のために手段を選ぶ',
    head: '<em>目標志向</em> <span class="rt__en">Goal-driven</span>',
    lead: '「結果」を目指して<strong>手段を選ぶ</strong>（手順は固定でない）。',
    points: ['同じゴールでも状況で進め方が変わる', '行き止まりなら別の手を試す'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M8 20.5h8"/><path d="M5 7.5 12 6l7 1.5"/><path d="M5 7.5 2.6 13a3 3 0 0 0 4.8 0z"/><path d="M19 7.5 16.6 13a3 3 0 0 0 4.8 0z"/></svg> 対比', body: '従来の自動化＝<strong>手順が固定</strong><br>エージェント＝<strong>手段は可変</strong>' },
    sources: agentSrc,
  },
  {
    key: 'ツール利用', no: '③', tag: 'Tool use', sub: '外の道具を使う',
    head: '<em>ツール利用</em> <span class="rt__en">Tool use</span>',
    lead: '検索・計算・API・コード実行など<strong>外の道具を使う</strong>。',
    points: ['苦手な計算や最新情報を道具で補う', '実世界へ “手を伸ばす”'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.3 8.7a3.6 3.6 0 0 1-4.5 4.5l-5 5a1.8 1.8 0 0 1-2.5-2.5l5-5a3.6 3.6 0 0 1 4.5-4.5L10.4 8.1a1 1 0 0 0 1.4 1.4z"/></svg> 例', body: '検索 / 電卓 / カレンダー / 社内API / コード実行' },
    sources: agentSrc,
  },
  {
    key: '繰り返し', no: '④', tag: 'Loop', sub: '試す→観察→直す', now: true,
    head: '<em>繰り返し</em> <span class="rt__en">Loop</span>',
    lead: '一発で終わらず、<strong>試す→観察→直す</strong>を回す。',
    points: ['結果を見て次の行動を調整', '失敗を “次の入力” に変える'],
    card: { title: '<svg class="ico ico--inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8"/><path d="M20 3.5V8h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16"/><path d="M4 20.5V16h4.5"/></svg> ここが鍵', body: 'この <strong>ループ</strong> こそ、後半の主役になる性質。' },
    sources: agentSrc,
  },
]
</script>

<template>
  <RevealTabs :items="traits" variant="row" aria-label="エージェントの4つの性質（選んで詳細）" />
</template>
