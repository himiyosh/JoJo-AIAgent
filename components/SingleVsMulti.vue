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
  <div class="sm-wrap">
    <!-- Static topology header: lets the audience compare the two *shapes*
         (1 agent＋tools  vs  orchestrator→specialists) before opening a tab.
         Labels are structural only, so they don't duplicate the tab detail text.
         SVG font-size uses px units (unitless is scaled ~4x by the Slidev/UnoCSS
         reset). This header is projection-only; the portrait Reader keeps the
         RevealTabs comparison (recipe extracts .tk + tabs, not this header). -->
    <div class="sm-topo" aria-hidden="true">
      <div class="sm-topo__side">
        <div class="sm-topo__cap"><b>単一</b><span>Single</span></div>
        <svg class="sm-topo__svg" viewBox="0 0 260 50" font-family="Noto Sans JP, sans-serif">
          <!-- connectors: 1 agent → 3 tools -->
          <g stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.4" fill="none" stroke-linecap="round">
            <path d="M102 25H150" />
            <path d="M102 25C124 25 128 8 150 8" />
            <path d="M102 25C124 25 128 42 150 42" />
          </g>
          <!-- agent node -->
          <rect x="6" y="12" width="96" height="26" rx="8" fill="rgba(34,211,238,.1)" stroke="#22d3ee" stroke-opacity=".65" stroke-width="1.5" />
          <text x="54" y="29" text-anchor="middle" fill="#eef1fb" font-size="12px" font-weight="800">エージェント</text>
          <!-- 3 tools -->
          <g>
            <rect x="150" y="1" width="64" height="14" rx="5" fill="rgba(255,255,255,.04)" stroke="#8b93a7" stroke-opacity=".5" stroke-width="1.2" />
            <text x="182" y="11" text-anchor="middle" fill="#c6cdda" font-size="9.5px" font-weight="700">道具</text>
            <rect x="150" y="18" width="64" height="14" rx="5" fill="rgba(255,255,255,.04)" stroke="#8b93a7" stroke-opacity=".5" stroke-width="1.2" />
            <text x="182" y="28" text-anchor="middle" fill="#c6cdda" font-size="9.5px" font-weight="700">道具</text>
            <rect x="150" y="35" width="64" height="14" rx="5" fill="rgba(255,255,255,.04)" stroke="#8b93a7" stroke-opacity=".5" stroke-width="1.2" />
            <text x="182" y="45" text-anchor="middle" fill="#c6cdda" font-size="9.5px" font-weight="700">道具</text>
          </g>
        </svg>
      </div>

      <span class="sm-topo__vs" aria-hidden="true">VS</span>

      <div class="sm-topo__side">
        <div class="sm-topo__cap"><b>マルチ</b><span>Multi</span></div>
        <svg class="sm-topo__svg" viewBox="0 0 260 50" font-family="Noto Sans JP, sans-serif">
          <!-- connectors: orchestrator → 3 specialists (fan-out) -->
          <g stroke="#a855f7" stroke-opacity=".6" stroke-width="1.4" fill="none" stroke-linecap="round">
            <path d="M130 25C130 31 45 30 45 35" />
            <path d="M130 25V35" />
            <path d="M130 25C130 31 215 30 215 35" />
          </g>
          <!-- orchestrator -->
          <rect x="86" y="1" width="88" height="24" rx="8" fill="rgba(168,85,247,.12)" stroke="#a855f7" stroke-opacity=".7" stroke-width="1.5" />
          <text x="130" y="17" text-anchor="middle" fill="#eef1fb" font-size="12px" font-weight="800">指揮役</text>
          <!-- 3 specialists -->
          <g>
            <rect x="12" y="35" width="66" height="15" rx="6" fill="rgba(34,211,238,.08)" stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.3" />
            <text x="45" y="46" text-anchor="middle" fill="#d6e3f4" font-size="9.5px" font-weight="700">専門</text>
            <rect x="97" y="35" width="66" height="15" rx="6" fill="rgba(34,211,238,.08)" stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.3" />
            <text x="130" y="46" text-anchor="middle" fill="#d6e3f4" font-size="9.5px" font-weight="700">専門</text>
            <rect x="182" y="35" width="66" height="15" rx="6" fill="rgba(34,211,238,.08)" stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.3" />
            <text x="215" y="46" text-anchor="middle" fill="#d6e3f4" font-size="9.5px" font-weight="700">専門</text>
          </g>
        </svg>
      </div>
    </div>

    <RevealTabs :items="options" variant="pair" aria-label="単一エージェント か マルチか（選んで詳細）" />
  </div>
</template>
