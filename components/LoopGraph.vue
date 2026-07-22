<script setup lang="ts">
// Bespoke "Loop is one node in a bigger Graph" illustration (companion to
// AgentLoop.vue). On-brand, icon-driven, no hairball network — a single main
// chain (Trigger → Planner → Loop → Evaluator → Done) plus two labelled
// feedback bands under it (retry into the Loop / escalate to a Human), and a
// dashed "State" frame that visually groups the nodes sharing checkpointed
// state. The Loop node carries a small "①" badge so the contrast with the
// single ReAct loop (previous slide) reads in ~2s: that whole familiar loop
// is just ONE box here.
</script>

<template>
  <div class="lgraph">
    <div class="lgraph__frame" aria-hidden="true"><span class="lgraph__frame-tag">GRAPH＝実行グラフ全体</span></div>

    <div class="lgraph__row">
      <div class="lgraph__pill lgraph__pill--in">
        <Ico name="target" /><span>依頼・Issue</span>
      </div>
      <span class="lgraph__chev" aria-hidden="true">›</span>

      <div class="lgraph__node is-plan">
        <span class="lgraph__tile"><Ico name="split" /></span>
        <span class="lgraph__jp">Planner</span>
        <span class="lgraph__en">計画・分岐</span>
      </div>
      <span class="lgraph__chev" aria-hidden="true">›</span>

      <div class="lgraph__statewrap">
        <span class="lgraph__state-tag">State（進捗・チェックポイント）を共有</span>
        <div class="lgraph__state-row">
          <div class="lgraph__node is-loop">
            <span class="lgraph__badge" aria-hidden="true">①</span>
            <span class="lgraph__tile"><Ico name="loop" /></span>
            <span class="lgraph__jp">Loop：実装</span>
            <span class="lgraph__en">Agent Loop</span>
          </div>
          <span class="lgraph__chev" aria-hidden="true">›</span>
          <div class="lgraph__node is-eval">
            <span class="lgraph__tile"><Ico name="scales" /></span>
            <span class="lgraph__jp">検証ゲート</span>
            <span class="lgraph__en">Evaluator</span>
          </div>
        </div>
      </div>

      <span class="lgraph__chev lgraph__chev--ok" aria-hidden="true">›</span>
      <div class="lgraph__pill lgraph__pill--done">
        <Ico name="check" /><span>統合・完了</span>
      </div>
    </div>

    <div class="lgraph__bands">
      <div class="lgraph__band is-retry">
        <span class="lgraph__band-line" aria-hidden="true"></span>
        <span class="lgraph__band-label">NG → <strong>Loopへ差し戻し</strong>（再試行）</span>
      </div>
      <div class="lgraph__band is-escalate">
        <span class="lgraph__band-line" aria-hidden="true"></span>
        <span class="lgraph__band-label">要判断 →
          <span class="lgraph__inline-node"><Ico name="user" />Human確認</span>
          → 完了へ合流</span>
      </div>
    </div>

    <p class="lgraph__cap">
      <strong>①（Loop）</strong>は、前ページの反復そのもの＝<span class="whitespace-nowrap">Graph の中の1つの node</span> にすぎない。
      <span class="whitespace-nowrap">分岐・合流・状態・Human の確認</span>まで配線するのが Graph 全体。
    </p>
  </div>
</template>

<style scoped>
.lgraph { display: flex; flex-direction: column; align-items: center; gap: .5rem; margin: 1rem auto 0; position: relative; }

/* ---- outer "this whole picture is the Graph" frame (wraps main row + both
   feedback bands = every node/edge; excludes only the grounding caption) ---- */
.lgraph__frame {
  position: absolute; inset: -.55rem -.5rem 3.65rem;
  border: 1.4px dashed color-mix(in srgb, var(--brand-b) 30%, var(--line));
  border-radius: 1.1rem; pointer-events: none;
}
.lgraph__frame-tag {
  position: absolute; top: -.62em; left: 1.1rem; padding: 0 .5em;
  background: var(--bg-1);
  font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: .62rem;
  letter-spacing: .08em; color: color-mix(in srgb, var(--brand-b) 78%, var(--ink-soft));
}

.lgraph__row { display: flex; align-items: center; justify-content: center; gap: .3rem; flex-wrap: nowrap; padding: 1.3rem .4rem .2rem; }

.lgraph__node {
  display: flex; flex-direction: column; align-items: center; gap: .12rem; position: relative;
  padding: .55rem .55rem .5rem; border-radius: .7rem; min-width: 5.2rem;
  border: 1px solid var(--line); background: rgba(255, 255, 255, .025);
}
.lgraph__tile {
  width: 2.35rem; height: 2.35rem; border-radius: .55rem; margin-bottom: .1rem;
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
}
.lgraph__jp { font-weight: 800; font-size: .88rem; color: #eef1fb; line-height: 1.15; white-space: nowrap; }
.lgraph__en { font-family: 'JetBrains Mono', monospace; font-size: .58rem; letter-spacing: .02em; color: var(--muted); white-space: nowrap; }

.is-plan { border-color: color-mix(in srgb, #818cf8 40%, var(--line)); }
.is-plan .lgraph__tile { color: #818cf8; background: color-mix(in srgb, #818cf8 12%, transparent); border: 1px solid color-mix(in srgb, #818cf8 26%, var(--line)); }
.is-loop { border-color: color-mix(in srgb, var(--brand-b) 46%, var(--line)); background: color-mix(in srgb, var(--brand-b) 6%, transparent); }
.is-loop .lgraph__tile { color: var(--brand-b); background: color-mix(in srgb, var(--brand-b) 14%, transparent); border: 1px solid color-mix(in srgb, var(--brand-b) 30%, var(--line)); }
.is-eval { border-color: color-mix(in srgb, var(--accent-warm) 42%, var(--line)); }
.is-eval .lgraph__tile { color: var(--accent-warm-ink); background: color-mix(in srgb, var(--accent-warm) 13%, transparent); border: 1px solid color-mix(in srgb, var(--accent-warm) 28%, var(--line)); }

.lgraph__badge {
  position: absolute; top: -.6rem; left: -.6rem; width: 1.3rem; height: 1.3rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: .68rem;
  color: #1a1140; background: var(--brand-b); box-shadow: 0 2px 10px -3px color-mix(in srgb, var(--brand-b) 70%, transparent);
}

.lgraph__chev { font-size: 1.3rem; font-weight: 700; color: var(--muted); line-height: 1; }
.lgraph__chev--ok { color: #22c55e; }

.lgraph__pill {
  display: inline-flex; align-items: center; gap: .32rem;
  padding: .48rem .68rem; border-radius: .6rem; font-weight: 700; font-size: .85rem;
  border: 1px solid var(--line); background: rgba(255, 255, 255, .03); color: #e7ecf6; white-space: nowrap;
}
.lgraph__pill .ico { font-size: 1.1rem; }
.lgraph__pill--in .ico { color: #9fb0cc; }
.lgraph__pill--done { border-color: color-mix(in srgb, #22c55e 45%, var(--line)); background: color-mix(in srgb, #22c55e 9%, transparent); }
.lgraph__pill--done .ico { color: #22c55e; }

/* ---- State frame: dashed box grouping the Loop + Evaluator (nodes that read/write shared state) ---- */
.lgraph__statewrap { position: relative; padding: 1rem .6rem .5rem; }
.lgraph__statewrap::before {
  content: ""; position: absolute; inset: .55rem 0 0; border-radius: .85rem;
  border: 1.3px dashed color-mix(in srgb, var(--brand-a) 42%, var(--line));
  background: color-mix(in srgb, var(--brand-a) 4%, transparent);
}
@media (prefers-reduced-motion: no-preference) {
  .lgraph__statewrap::before { animation: lgraph-state-pulse 5.2s ease-in-out infinite; }
}
/* subtle "state is live" breathing glow on the dashed frame — same restrained
   technique as the deck's existing .nest ripple (style.css), never a hard blink */
@keyframes lgraph-state-pulse {
  0%, 100% { box-shadow: 0 0 0 0 transparent; border-color: color-mix(in srgb, var(--brand-a) 42%, var(--line)); }
  50% { box-shadow: 0 0 20px -6px color-mix(in srgb, var(--brand-a) 55%, transparent); border-color: color-mix(in srgb, var(--brand-a) 68%, var(--line)); }
}
.lgraph__state-tag {
  position: relative; z-index: 1; display: block; text-align: center; margin-bottom: -.2rem;
  font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: .58rem; letter-spacing: .04em;
  color: color-mix(in srgb, var(--brand-a) 82%, var(--ink-soft));
}
.lgraph__state-row { position: relative; z-index: 1; display: flex; align-items: center; gap: .3rem; }

/* ---- feedback bands (same visual grammar as AgentLoop's single "retry" band, extended to two) ---- */
.lgraph__bands { display: flex; flex-direction: column; align-items: center; gap: .42rem; width: min(88%, 760px); margin-top: .1rem; }
.lgraph__band { display: flex; align-items: center; gap: .6rem; width: 100%; }
.lgraph__band-line { flex: 1; height: 0; border-top: 1.5px dashed; position: relative; }
/* arrowhead tip (not a card side-accent) — same zero-size border-triangle
   technique as AgentLoop.vue's .aloop__back-line::before, kept for visual
   consistency between the deck's two feedback-loop diagrams */
.lgraph__band-line::before {
  content: ""; position: absolute; left: 0; top: -4px;
  border: 5px solid transparent; border-right-width: 6px; border-left: 0;
}
.is-retry .lgraph__band-line { border-top-color: color-mix(in srgb, var(--accent-warm) 55%, var(--line)); }
.is-retry .lgraph__band-line::before { border-right-color: color-mix(in srgb, var(--accent-warm) 65%, var(--line)); }
.is-escalate .lgraph__band-line { border-top-color: color-mix(in srgb, var(--accent-warn) 55%, var(--line)); }
.is-escalate .lgraph__band-line::before { border-right-color: color-mix(in srgb, var(--accent-warn) 65%, var(--line)); }
.lgraph__band-label { font-size: .78rem; color: var(--ink-soft); white-space: nowrap; display: inline-flex; align-items: center; gap: .3rem; }
.is-retry .lgraph__band-label strong { color: var(--accent-warm-ink); }
.is-escalate .lgraph__band-label strong { color: var(--accent-warn); }
.lgraph__inline-node {
  display: inline-flex; align-items: center; gap: .22rem;
  padding: .1rem .45rem; border-radius: .5rem; font-weight: 700; color: #f5d3d8;
  border: 1px solid color-mix(in srgb, var(--accent-warn) 40%, var(--line));
  background: color-mix(in srgb, var(--accent-warn) 10%, transparent);
}
.lgraph__inline-node .ico { font-size: .95em; color: var(--accent-warn); }

.lgraph__cap {
  max-width: 46em; margin: .55rem auto 0; text-align: center;
  font-size: .86rem; line-height: 1.55; color: var(--ink-soft); text-wrap: balance;
  word-break: auto-phrase;
}
.lgraph__cap strong { color: #fff; }

@media (prefers-reduced-motion: reduce) {
  .lgraph__statewrap::before { animation: none; }
}
</style>
