<script setup lang="ts">
// Bespoke ReAct loop illustration (replaces the emoji-bearing mermaid diagram).
// Icon-driven, on-brand: cyan = cognition, purple = action, amber = decision, green = done.
const phases = [
  { ico: 'eye',    jp: '知覚',  en: 'Perceive', kind: 'cog' },
  { ico: 'brain',  jp: '思考',  en: 'Reason',   kind: 'cog' },
  { ico: 'wrench', jp: '行動',  en: 'Act',      kind: 'act' },
  { ico: 'search', jp: '観察',  en: 'Observe',  kind: 'act' },
]
</script>

<template>
  <div class="aloop">
    <div class="aloop__row">
      <div class="aloop__pill aloop__pill--in">
        <Ico name="target" /><span>目標・指示</span>
      </div>
      <span class="aloop__chev" aria-hidden="true">›</span>

      <template v-for="(p, i) in phases" :key="p.jp">
        <div class="aloop__node" :class="`is-${p.kind}`">
          <span class="aloop__tile"><Ico :name="p.ico" /></span>
          <span class="aloop__jp">{{ p.jp }}</span>
          <span class="aloop__en">{{ p.en }}</span>
        </div>
        <span class="aloop__chev" aria-hidden="true">›</span>
      </template>

      <div class="aloop__dec">
        <span class="aloop__dec-q">完了?</span>
      </div>
      <span class="aloop__chev aloop__chev--ok" aria-hidden="true">›</span>
      <div class="aloop__pill aloop__pill--done">
        <Ico name="check" /><span>回答・完了</span>
      </div>
    </div>

    <div class="aloop__back">
      <span class="aloop__back-line" aria-hidden="true"></span>
      <span class="aloop__back-label">まだ → <strong>再試行</strong>（毎回 文脈が増えて賢くなる）</span>
      <span class="aloop__back-line" aria-hidden="true"></span>
    </div>
  </div>
</template>

<style scoped>
.aloop { display: flex; flex-direction: column; align-items: center; gap: .55rem; margin: 1.4rem auto 0; }
.aloop__row { display: flex; align-items: center; justify-content: center; gap: .28rem; flex-wrap: nowrap; }

.aloop__node {
  display: flex; flex-direction: column; align-items: center; gap: .12rem;
  padding: .55rem .5rem .5rem; border-radius: .7rem; min-width: 5.1rem;
  border: 1px solid var(--line); background: rgba(255, 255, 255, .025);
}
.aloop__tile {
  width: 2.5rem; height: 2.5rem; border-radius: .55rem; margin-bottom: .12rem;
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
}
.aloop__jp { font-weight: 800; font-size: .95rem; color: #eef1fb; line-height: 1.15; }
.aloop__en { font-family: 'JetBrains Mono', monospace; font-size: .6rem; letter-spacing: .03em; color: var(--muted); }

.is-cog { border-color: color-mix(in srgb, var(--brand-a) 42%, var(--line)); }
.is-cog .aloop__tile { color: var(--brand-a); background: color-mix(in srgb, var(--brand-a) 12%, transparent); border: 1px solid color-mix(in srgb, var(--brand-a) 26%, var(--line)); }
.is-act { border-color: color-mix(in srgb, var(--brand-b) 42%, var(--line)); }
.is-act .aloop__tile { color: var(--brand-b); background: color-mix(in srgb, var(--brand-b) 12%, transparent); border: 1px solid color-mix(in srgb, var(--brand-b) 26%, var(--line)); }

.aloop__chev { font-size: 1.4rem; font-weight: 700; color: var(--muted); line-height: 1; }
.aloop__chev--ok { color: #eab308; }

.aloop__pill {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .5rem .7rem; border-radius: .6rem; font-weight: 700; font-size: .9rem;
  border: 1px solid var(--line); background: rgba(255, 255, 255, .03); color: #e7ecf6; white-space: nowrap;
}
.aloop__pill .ico { font-size: 1.2rem; }
.aloop__pill--in .ico { color: #9fb0cc; }
.aloop__pill--done { border-color: color-mix(in srgb, #22c55e 45%, var(--line)); background: color-mix(in srgb, #22c55e 9%, transparent); }
.aloop__pill--done .ico { color: #22c55e; }

.aloop__dec {
  display: flex; align-items: center; justify-content: center; white-space: nowrap;
  padding: .5rem .8rem; border-radius: .6rem; font-weight: 800; font-size: .92rem;
  color: #fdf3d0; border: 1px solid color-mix(in srgb, #eab308 52%, var(--line));
  background: color-mix(in srgb, #eab308 11%, transparent);
}

.aloop__back { display: flex; align-items: center; gap: .7rem; width: min(72%, 640px); margin-top: .15rem; }
.aloop__back-line { flex: 1; height: 0; border-top: 1.5px dashed color-mix(in srgb, var(--brand-b) 50%, var(--line)); position: relative; }
.aloop__back-line:first-child::before {
  content: ""; position: absolute; left: 0; top: -4px;
  border: 5px solid transparent; border-right-color: color-mix(in srgb, var(--brand-b) 60%, var(--line)); border-left: 0;
}
.aloop__back-label { font-size: .82rem; color: var(--ink-soft); white-space: nowrap; }
.aloop__back-label strong { color: var(--brand-b); }
</style>
