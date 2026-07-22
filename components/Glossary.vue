<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useNav } from '@slidev/client'
import { GLOSSARY, activeTerm, termHits, originPage } from '../composables/glossary'

const nav = useNav()
const root = ref<HTMLElement>()
let clearTimer: ReturnType<typeof setTimeout> | undefined

function highlight() {
  const r = root.value
  if (!r || !activeTerm.value) return
  const el = r.querySelector<HTMLElement>('#g-' + activeTerm.value)
  if (!el || el.offsetParent === null) return        // not the visible instance yet
  r.querySelectorAll('.is-hit').forEach(n => n.classList.remove('is-hit'))
  void el.offsetWidth                                 // restart the animation
  el.classList.add('is-hit')
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  clearTimeout(clearTimer)
  clearTimer = setTimeout(() => el.classList.remove('is-hit'), 2600)
}

watch([activeTerm, termHits], async () => {
  if (!activeTerm.value) return
  await nextTick()
  requestAnimationFrame(() => requestAnimationFrame(highlight))
})

onMounted(async () => {
  if (activeTerm.value) { await nextTick(); requestAnimationFrame(highlight) }
})

function back() {
  const p = originPage.value
  activeTerm.value = null
  originPage.value = null
  if (p) nav.go(p)
}
</script>

<template>
  <div class="gl" ref="root">
    <button v-if="originPage" class="gl__back" type="button" @click="back">
      ← 元のスライドに戻る
    </button>

    <dl class="gl__grid">
      <div v-for="g in GLOSSARY" :key="g.id" class="gl__item" :id="'g-' + g.id">
        <dt class="gl__term">
          {{ g.term }}<span v-if="g.en" class="gl__en">{{ g.en }}</span>
        </dt>
        <dd class="gl__def">{{ g.short }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.gl { position: relative; margin-top: .25rem; }

.gl__back {
  position: absolute; top: -3.1rem; right: 0;
  display: inline-flex; align-items: center; gap: .3rem; cursor: pointer;
  font-family: 'JetBrains Mono', monospace; font-size: .74rem; font-weight: 700;
  padding: .34rem .7rem; border-radius: .55rem;
  color: #eaf0fb; background: color-mix(in srgb, var(--brand-a) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--brand-a) 42%, var(--line));
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.gl__back:hover { border-color: var(--brand-a); background: color-mix(in srgb, var(--brand-a) 20%, transparent); color: #fff; }
.gl__back:focus-visible { outline: 2px solid var(--brand-a); outline-offset: 2px; }

.gl__grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(205px, 1fr));
  gap: .16rem .7rem; margin: 0;
}
.gl__item {
  border: 1px solid var(--line); border-radius: .6rem;
  padding: .28rem .6rem; background: rgba(255, 255, 255, .02);
  transition: border-color .25s ease, background .25s ease, box-shadow .25s ease, transform .25s ease;
}
.gl__term {
  font-size: .82rem; font-weight: 800; line-height: 1.22; color: #f3f6fc;
  display: flex; align-items: baseline; flex-wrap: wrap; gap: .2rem .4rem;
}
.gl__en {
  font-family: 'JetBrains Mono', monospace; font-size: .58rem; font-weight: 600;
  letter-spacing: .02em; color: var(--brand-a);
}
.gl__def { margin: .12rem 0 0; font-size: .65rem; line-height: 1.36; color: var(--ink-soft); }

/* highlight when arrived via an inline 用語 link */
.gl__item.is-hit {
  border-color: transparent; background: color-mix(in srgb, var(--brand-a) 12%, transparent);
  box-shadow: 0 0 0 2px var(--brand-a), 0 8px 26px color-mix(in srgb, var(--brand-a) 30%, transparent);
  animation: gl-pulse 1.1s cubic-bezier(.22, 1, .36, 1);
}
.gl__item.is-hit .gl__term { color: #fff; }
@keyframes gl-pulse {
  0%   { transform: scale(1); }
  28%  { transform: scale(1.035); }
  100% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .gl__item.is-hit { animation: none; }
  .gl__back, .gl__item { transition: none; }
}
</style>
