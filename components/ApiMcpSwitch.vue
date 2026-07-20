<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'

type ComparisonMode = {
  key: string
  tag: string
  sub: string
  title: string
  description: string
  ruleLabel: string
  ruleValue: string
  points: string[]
  card: {
    title: string
    body: string
    note: string
  }
}

const modes: ComparisonMode[] = [
  {
    key: 'REST API',
    tag: 'SERVICE CONNECTION',
    sub: 'サービスの機能を直接呼ぶ',
    title: 'サービスの機能を、HTTPで直接呼ぶ',
    description: '接続先ごとに、URL・認証・データ形式を合わせます。',
    ruleLabel: '通信の相手',
    ruleValue: 'サービス',
    points: [
      '通信の相手：サービス',
      'URL・認証・データ形式はサービスごとに実装',
    ],
    card: {
      title: 'REST APIがそろえるもの',
      body: 'サービスへ要求を送り、結果を受け取る通信方法。',
      note: '例：天気API、社内システムAPI',
    },
  },
  {
    key: 'MCP',
    tag: 'AI CONNECTION',
    sub: 'AIと道具の入口を共通化する',
    title: 'AIと道具のつなぎ方を、共通化する',
    description: 'Host / Client と Server の会話ルールをそろえます。',
    ruleLabel: '共通化するもの',
    ruleValue: 'AIと道具の接続',
    points: [
      '接続の相手：MCP Server',
      'Serverの内側でREST APIやローカル機能を利用',
    ],
    card: {
      title: 'MCPがそろえるもの',
      body: 'AIアプリが道具を見つけ、要求し、結果を受け取る作法。',
      note: 'REST APIを置き換えず、その手前で使える',
    },
  },
]

const selected = ref(0)
const current = computed(() => modes[selected.value])
const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const panelId = `${uid}-api-mcp-panel`
const tabId = (index: number) => `${uid}-api-mcp-tab-${index + 1}`

function select(index: number) {
  selected.value = index
}

async function onKey(event: KeyboardEvent, index: number) {
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']
  if (!keys.includes(event.key))
    return

  event.preventDefault()
  if (event.key === 'Home')
    selected.value = 0
  else if (event.key === 'End')
    selected.value = modes.length - 1
  else {
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    selected.value = (index + direction + modes.length) % modes.length
  }

  await nextTick()
  document.getElementById(tabId(selected.value))?.focus()
}
</script>

<template>
  <div class="rt api-mcp">
    <div class="rt__tabs api-mcp__tabs" role="tablist" aria-label="REST APIとMCPの表示切り替え">
      <button
        v-for="(mode, index) in modes"
        :id="tabId(index)"
        :key="mode.key"
        class="rt__tab api-mcp__tab"
        :class="{ 'is-sel': selected === index }"
        role="tab"
        :aria-selected="selected === index"
        :aria-controls="panelId"
        :tabindex="selected === index ? 0 : -1"
        @click.stop="select(index)"
        @keydown.stop="onKey($event, index)"
      >
        <span class="rt__top">
          <span class="rt__k">{{ mode.key }}</span>
          <span class="rt__selected" :class="{ 'is-visible': selected === index }" aria-hidden="true">表示中</span>
        </span>
        <span class="rt__tag">{{ mode.tag }}</span>
        <span class="rt__sub">{{ mode.sub }}</span>
      </button>
    </div>

    <div class="rt__stage api-mcp__stage">
      <Transition name="api-mcp" mode="out-in">
        <article
          :id="panelId"
          :key="current.key"
          class="api-mcp__panel"
          :class="selected === 0 ? 'is-rest' : 'is-mcp'"
          :data-mode="selected === 0 ? 'rest' : 'mcp'"
          role="tabpanel"
          :aria-labelledby="tabId(selected)"
        >
          <div class="api-mcp__copy">
            <span class="api-mcp__mode">{{ current.key }}</span>
            <h3>{{ current.title }}</h3>
            <p>{{ current.description }}</p>
            <div class="api-mcp__rule">
              <span>{{ current.ruleLabel }}</span>
              <strong>{{ current.ruleValue }}</strong>
            </div>
          </div>

          <div v-if="selected === 0" class="api-mcp__diagram api-mcp__diagram--rest" aria-hidden="true">
            <div class="api-mcp__node">
              <small>CALLER</small>
              <b>AIアプリ</b>
            </div>
            <div class="api-mcp__link">
              <span>HTTP / JSON</span>
              <i>→</i>
            </div>
            <div class="api-mcp__node api-mcp__node--target">
              <small>SERVICE</small>
              <b>REST endpoint</b>
              <em>サービス固有</em>
            </div>
          </div>

          <div v-else class="api-mcp__diagram api-mcp__diagram--mcp" aria-hidden="true">
            <div class="api-mcp__node">
              <small>MCP HOST</small>
              <b>AIアプリ</b>
              <em>MCP Client</em>
            </div>
            <div class="api-mcp__link api-mcp__link--mcp">
              <span>MCP</span>
              <i>⇄</i>
            </div>
            <div class="api-mcp__node api-mcp__node--server">
              <small>COMMON ENTRY</small>
              <b>MCP Server</b>
            </div>
            <div class="api-mcp__link api-mcp__link--internal">
              <span>内部で利用</span>
              <i>→</i>
            </div>
            <div class="api-mcp__node api-mcp__node--target">
              <small>SERVICE / LOCAL</small>
              <b>REST API</b>
              <em>ローカル機能も可</em>
            </div>
          </div>
        </article>
      </Transition>
    </div>

    <div class="rt__bar api-mcp__bar">
      <span>覚えること</span>
      <strong>MCP Server の内側で REST API を使える</strong>
    </div>

    <div class="rt__measure" aria-hidden="true">
      <div
        v-for="mode in modes"
        :key="`measure-${mode.key}`"
        class="rt__detail api-mcp__measure-state"
      >
        <div class="card__ba">{{ mode.key }} · {{ mode.tag }}</div>
        <div class="rt__head">
          <h3 class="rt__badge">{{ mode.title }}</h3>
        </div>
        <p class="rt__lead">{{ mode.description }}</p>
        <ul class="rt__points">
          <li v-for="point in mode.points" :key="point">{{ point }}</li>
        </ul>
        <aside class="rt__card">
          <div class="rt__card-t">{{ mode.card.title }}</div>
          <div class="rt__card-b">{{ mode.card.body }}</div>
          <div class="rt__card-n">{{ mode.card.note }}</div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.api-mcp {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: .42rem;
  min-height: 0;
  margin-top: .45rem;
}

.api-mcp__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .7rem;
  margin: 0;
}

.api-mcp__tab {
  position: relative;
  min-width: 0;
  min-height: 3.85rem;
  padding: .55rem .85rem;
  border: 1px solid color-mix(in srgb, var(--ink) 10%, var(--line));
  border-radius: .72rem;
  background: var(--surface);
  box-shadow: var(--surface-shadow);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color .18s cubic-bezier(.16, 1, .3, 1),
    background-color .18s cubic-bezier(.16, 1, .3, 1),
    transform .18s cubic-bezier(.16, 1, .3, 1);
}

.api-mcp__tab:hover {
  border-color: color-mix(in srgb, var(--brand-a) 48%, var(--line));
  transform: translateY(-2px);
}

.api-mcp__tab:active {
  transform: translateY(0);
}

.api-mcp__tab:focus-visible {
  outline: 3px solid var(--brand-a);
  outline-offset: 3px;
}

.api-mcp__tab.is-sel {
  border-color: var(--brand-a);
  background: color-mix(in srgb, var(--brand-a) 10%, var(--bg-1));
}

.api-mcp__tab:nth-child(2).is-sel {
  border-color: var(--brand-b);
  background: color-mix(in srgb, var(--brand-b) 11%, var(--bg-1));
}

.rt__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
}

.rt__k {
  color: var(--ink);
  font-size: 1.02rem;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;
}

.api-mcp__tab.is-sel .rt__k {
  color: var(--brand-a);
}

.api-mcp__tab:nth-child(2).is-sel .rt__k {
  color: color-mix(in srgb, var(--brand-b) 72%, var(--ink));
}

.rt__selected {
  color: var(--brand-a);
  font-family: 'JetBrains Mono', monospace;
  font-size: .55rem;
  font-weight: 800;
  opacity: 0;
}

.api-mcp__tab:nth-child(2) .rt__selected {
  color: color-mix(in srgb, var(--brand-b) 72%, var(--ink));
}

.rt__selected.is-visible {
  opacity: 1;
}

.rt__tag {
  display: block;
  margin-top: .24rem;
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: .56rem;
  font-weight: 800;
  letter-spacing: .06em;
  white-space: nowrap;
}

.rt__sub {
  display: block;
  margin-top: .12rem;
  color: var(--ink-soft);
  font-size: .73rem;
  line-height: 1.2;
  white-space: nowrap;
}

.api-mcp__stage {
  position: relative;
  flex: none;
  height: 11.35rem;
  min-height: 11.35rem;
}

.api-mcp__panel {
  --mode-color: var(--brand-a);
  display: grid;
  grid-template-columns: minmax(0, .78fr) minmax(0, 1.22fr);
  align-items: center;
  gap: 1.15rem;
  width: 100%;
  height: 100%;
  padding: .85rem 1rem;
  border: 1px solid color-mix(in srgb, var(--mode-color) 36%, var(--line));
  border-radius: .86rem;
  background:
    radial-gradient(circle at 84% 50%, color-mix(in srgb, var(--mode-color) 10%, transparent), transparent 43%),
    color-mix(in srgb, var(--ink) 1.8%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--ink) 5%, transparent);
}

.api-mcp__panel.is-mcp {
  --mode-color: var(--brand-b);
}

.api-mcp__copy {
  min-width: 0;
}

.api-mcp__mode {
  color: var(--mode-color);
  font-family: 'JetBrains Mono', monospace;
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .08em;
}

.api-mcp__copy h3 {
  margin: .22rem 0 .38rem;
  color: var(--ink);
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1.22;
  text-wrap: balance;
}

.api-mcp__copy p {
  margin: 0;
  color: var(--ink-soft);
  font-size: .82rem;
  line-height: 1.5;
  text-wrap: pretty;
}

.api-mcp__rule {
  display: flex;
  align-items: baseline;
  gap: .58rem;
  margin-top: .7rem;
  padding-top: .55rem;
  border-top: 1px solid var(--line);
}

.api-mcp__rule span {
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: .57rem;
  font-weight: 700;
}

.api-mcp__rule strong {
  color: var(--mode-color);
  font-size: .8rem;
  font-weight: 900;
}

.api-mcp__diagram {
  display: grid;
  align-items: center;
  gap: .42rem;
  min-width: 0;
}

.api-mcp__diagram--rest {
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.18fr);
}

.api-mcp__diagram--mcp {
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1.08fr);
  gap: .3rem;
}

.api-mcp__node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 4.6rem;
  padding: .55rem .45rem;
  border: 1px solid color-mix(in srgb, var(--brand-a) 42%, var(--line));
  border-radius: .72rem;
  background: color-mix(in srgb, var(--brand-a) 7%, var(--bg-1));
  text-align: center;
}

.is-mcp .api-mcp__node {
  border-color: color-mix(in srgb, var(--brand-b) 34%, var(--line));
  background: color-mix(in srgb, var(--brand-b) 6%, var(--bg-1));
}

.api-mcp__node--server {
  border-color: color-mix(in srgb, var(--brand-b) 66%, var(--line)) !important;
  box-shadow: 0 0 20px -10px var(--brand-b);
}

.api-mcp__node--target {
  border-color: color-mix(in srgb, var(--accent-warm) 42%, var(--line));
  background: color-mix(in srgb, var(--accent-warm) 5%, var(--bg-1));
}

.api-mcp__node small {
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: .49rem;
  font-weight: 700;
  letter-spacing: .05em;
  line-height: 1.15;
  white-space: nowrap;
}

.api-mcp__node b {
  margin-top: .26rem;
  color: var(--ink);
  font-size: .82rem;
  font-weight: 900;
  line-height: 1.2;
  white-space: nowrap;
}

.api-mcp__node em {
  margin-top: .2rem;
  color: var(--ink-soft);
  font-size: .56rem;
  font-style: normal;
  line-height: 1.2;
  white-space: nowrap;
}

.api-mcp__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--brand-a);
}

.api-mcp__link span {
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: .46rem;
  font-weight: 700;
  white-space: nowrap;
}

.api-mcp__link i {
  margin-top: .16rem;
  font-size: 1.15rem;
  font-style: normal;
  font-weight: 900;
  line-height: 1;
}

.api-mcp__link--mcp {
  color: color-mix(in srgb, var(--brand-b) 74%, var(--ink));
}

.api-mcp__link--internal {
  color: var(--accent-warm);
}

.api-mcp__bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .7rem;
  min-height: 1.55rem;
  padding: .28rem .7rem;
  border: 1px solid color-mix(in srgb, var(--accent-warm) 24%, var(--line));
  border-radius: .6rem;
  background: color-mix(in srgb, var(--accent-warm) 5%, transparent);
}

.api-mcp__bar span {
  color: var(--accent-warm-ink);
  font-family: 'JetBrains Mono', monospace;
  font-size: .55rem;
  font-weight: 800;
  letter-spacing: .04em;
}

.api-mcp__bar strong {
  color: var(--ink);
  font-size: .72rem;
  font-weight: 800;
}

.rt__measure {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: -1;
  visibility: hidden;
  pointer-events: none;
  clip-path: inset(0 0 100% 0);
}

.api-mcp__measure-state {
  padding: .75rem;
}

.api-mcp-enter-active,
.api-mcp-leave-active {
  transition: opacity .16s cubic-bezier(.16, 1, .3, 1);
}

.api-mcp-enter-from,
.api-mcp-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .api-mcp__tab,
  .api-mcp-enter-active,
  .api-mcp-leave-active {
    transition: opacity .1s linear;
  }

  .api-mcp__tab:hover {
    transform: none;
  }
}
</style>
