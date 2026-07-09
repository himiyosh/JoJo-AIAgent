<script lang="ts">
export type RevealItem = {
  key: string
  no?: string            // leading glyph: ① or an emoji
  tag?: string           // small badge: year / category
  sub?: string           // one-line desc on the tab face (HTML ok)
  now?: boolean          // purple accent + "いま" pill
  head?: string          // big detail heading; <em> marks the ONE colored key term, .rt__en = muted 2nd (HTML ok)
  q?: string             // small subtitle under/after the heading (HTML ok)
  lead?: string          // detail intro line (HTML ok)
  points?: string[]      // detail bullet list (HTML ok per item)
  pros?: string[]        // detail pros (HTML ok)
  cons?: string[]        // detail cons (HTML ok)
  card?: { title: string; body: string; note?: string }  // side card (HTML ok)
  chips?: string[]       // keyword chips
  source?: { label: string; url: string }            // single citation
  sources?: { label: string; url: string }[]         // multiple citations (takes precedence over `source`)
}
</script>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'
import Cite from './Cite.vue'

const props = withDefaults(defineProps<{
  items: RevealItem[]
  ariaLabel: string
  variant?: 'timeline' | 'row' | 'pair'
  start?: number
}>(), { variant: 'row', start: 0 })

const sel = ref(props.start)

/* sources to show in the bottom bar: prefer the multi-citation list, fall back to single */
const curSources = computed(() => {
  const it = props.items[sel.value]
  return it.sources?.length ? it.sources : (it.source ? [it.source] : [])
})

/* ---- in-panel pagination state ---- */
const viewport = ref<HTMLElement>()
const track = ref<HTMLElement>()
const page = ref(0)
const pageCount = ref(1)
const availH = ref(0)

/* ---- stable panel height ----
   Tabs on one slide hold different amounts of copy, so a content-hugging panel
   would change height (and shift the title / closing note) every time you switch
   tab. We reserve the height of the TALLEST tab so the whole frame — title, tabs,
   panel, sources — stays fixed in place across tabs. Capped to the space actually
   available so a long, paginated tab still can't push content off the slide.
   The tallest height is read from an off-screen probe (.rt__measure) that renders
   every tab's panel at the real width — no cycling of the live, animated panel. */
const measureEl = ref<HTMLElement>()
const detailMinH = ref(0)
const cardMinH = ref(0)
const leadMinH = ref(0)

// Measure UNSCALED layout height: Slidev applies a CSS transform: scale() to the
// slide canvas, so getBoundingClientRect() returns *scaled* pixels while a CSS
// min-height is applied in *unscaled* layout pixels. Mixing the two inflates the
// reservation. offsetHeight is the unscaled layout height and matches min-height.
const boxH = (el: Element) => (el as HTMLElement).offsetHeight

async function measureTallest() {
  await nextTick()
  const m = measureEl.value
  if (!m) return
  // 1) Reserve the lead paragraph to its tallest across tabs (so a lead that wraps
  //    to a different line count doesn't push the bullets down) and the side-card to
  //    its tallest (so its bottom edge stops moving between tabs).
  let maxLead = 0
  for (const lead of Array.from(m.querySelectorAll('.rt__lead'))) maxLead = Math.max(maxLead, boxH(lead))
  leadMinH.value = maxLead
  let maxCard = 0
  for (const card of Array.from(m.querySelectorAll('.rt__card'))) maxCard = Math.max(maxCard, boxH(card))
  cardMinH.value = maxCard
  // 2) Let the probe re-render WITH the lead/card reservations applied, THEN read the
  //    true tallest panel height. Measuring the *natural* height first (as before)
  //    under-counts — the live panel is taller once the reservations expand it — so
  //    the reserved floor lands below what actually renders and can't equalise tabs
  //    whose engine wraps text to slightly different heights (Safari/WKWebView in the
  //    app canvas). That gap is exactly what makes the title/frame appear to shift on
  //    tab switch. Reserving the real rendered height pins every tab to one height.
  await nextTick()
  let maxNat = 0
  for (const child of Array.from(m.children)) maxNat = Math.max(maxNat, boxH(child))
  detailMinH.value = maxNat
  await nextTick()
  relayout()
}

const select = (i: number) => { sel.value = i }

const onKey = (e: KeyboardEvent, i: number) => {
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1
  sel.value = (i + dir + props.items.length) % props.items.length
  const tabs = (e.currentTarget as HTMLElement)?.parentElement
    ?.querySelectorAll<HTMLElement>('.rt__tab')
  tabs?.[sel.value]?.focus()
}

/* Split the detail body into pages that break only at block boundaries, so a
   tab whose content is taller than the available panel becomes 1·2·3 pages
   instead of clipping. Pages align to whole-viewport steps (no peeking). */
function relayout() {
  const vp = viewport.value
  const tr = track.value
  if (!vp || !tr) { pageCount.value = 1; return }
  const kids = Array.from(tr.children) as HTMLElement[]
  kids.forEach((k) => { k.style.marginTop = '' })
  void tr.offsetHeight // force reflow so offsets are measured without margins
  const avail = vp.clientHeight
  availH.value = avail
  const margins = kids.map(() => 0)
  let shift = 0
  let pageTop = 0
  for (let i = 0; i < kids.length; i++) {
    const top = kids[i].offsetTop + shift
    const h = kids[i].offsetHeight
    if (i > 0 && top + h > pageTop + avail + 1) {
      const extra = (pageTop + avail) - top
      if (extra > 0) { margins[i] = extra; shift += extra }
      pageTop += avail
    }
  }
  kids.forEach((k, i) => { if (margins[i]) k.style.marginTop = margins[i] + 'px' })
  pageCount.value = Math.round(pageTop / Math.max(avail, 1)) + 1
  if (page.value > pageCount.value - 1) page.value = pageCount.value - 1
}

const goPage = (p: number) => { page.value = Math.min(Math.max(p, 0), pageCount.value - 1) }

watch(sel, () => { page.value = 0 })   // reset paging when switching tabs
watch(() => props.items, () => { measureTallest() }, { deep: true })
onMounted(() => {
  measureTallest()
  window.addEventListener('resize', measureTallest)
  // re-measure once web fonts settle, since glyph metrics change wrap height
  ;(document as any).fonts?.ready?.then(() => measureTallest())
})
onBeforeUnmount(() => window.removeEventListener('resize', measureTallest))
</script>

<template>
  <div class="rt" :class="'rt--' + variant">
    <div class="rt__tabs" role="tablist" :aria-label="ariaLabel">
      <template v-for="(s, i) in items" :key="s.key">
        <button
          class="rt__tab"
          :class="{ 'is-sel': sel === i, 'is-now': s.now }"
          role="tab"
          :aria-selected="sel === i"
          :tabindex="sel === i ? 0 : -1"
          @click="select(i)"
          @keydown="onKey($event, i)"
        >
          <span class="rt__top">
            <span v-if="s.no" class="rt__no" v-html="s.no" />
            <span class="rt__k">
              {{ s.key }}
              <span v-if="s.now" class="rt__now">いま</span>
            </span>
          </span>
          <span v-if="s.tag" class="rt__tag">{{ s.tag }}</span>
          <span v-if="s.sub" class="rt__sub" v-html="s.sub" />
        </button>
        <span v-if="variant === 'timeline' && i < items.length - 1" class="rt__arrow" aria-hidden="true">›</span>
        <span v-else-if="variant === 'pair' && i < items.length - 1" class="rt__vs" aria-hidden="true">VS</span>
      </template>
    </div>

    <div class="rt__stage" :style="{ minHeight: detailMinH ? detailMinH + 'px' : undefined }">
    <Transition name="rt" mode="out-in" @after-enter="relayout">
      <div class="rt__detail" :class="{ 'is-now': items[sel].now, 'rt__detail--card': items[sel].card }" :key="sel" role="tabpanel" :style="{ minHeight: detailMinH ? detailMinH + 'px' : undefined }">
        <div v-if="items[sel].head || items[sel].no || items[sel].q || items[sel].tag" class="rt__head rt__block">
          <span v-if="items[sel].head" class="rt__badge" v-html="items[sel].head" />
          <span v-else class="rt__badge">
            <template v-if="items[sel].no">{{ items[sel].no }} </template>{{ items[sel].key
            }}<template v-if="items[sel].tag"> · {{ items[sel].tag }}</template>
          </span>
          <span v-if="items[sel].q" class="rt__q" v-html="items[sel].q" />
        </div>
        <div class="rt__viewport" :class="{ 'rt__viewport--single': pageCount === 1 }" ref="viewport">
          <div
            class="rt__track"
            ref="track"
            :style="{ transform: 'translateY(-' + (page * availH) + 'px)' }"
          >
            <p v-if="items[sel].lead" class="rt__lead rt__block" v-html="items[sel].lead" :style="{ minHeight: leadMinH ? leadMinH + 'px' : undefined }" />

            <div v-if="items[sel].points || items[sel].pros || items[sel].cons" class="rt__main rt__block">
              <ul v-if="items[sel].points" class="rt__points">
                <li v-for="p in items[sel].points" :key="p" v-html="p" />
              </ul>
              <div v-if="items[sel].pros || items[sel].cons" class="rt__pc">
                <div v-for="p in items[sel].pros" :key="p" class="pro" v-html="p" />
                <div v-for="c in items[sel].cons" :key="c" class="con" v-html="c" />
              </div>
            </div>

            <div v-if="items[sel].chips" class="rt__foot rt__block">
              <div class="rt__chips">
                <span v-for="c in items[sel].chips" :key="c" class="chip">{{ c }}</span>
              </div>
            </div>
          </div>
        </div>
        <aside v-if="items[sel].card" class="rt__card" :style="{ minHeight: cardMinH ? cardMinH + 'px' : undefined }">
          <div class="rt__card-t" v-html="items[sel].card.title" />
          <div class="rt__card-b" v-html="items[sel].card.body" />
          <div v-if="items[sel].card.note" class="rt__card-n" v-html="items[sel].card.note" />
        </aside>
      </div>
    </Transition>
    </div>

    <!-- off-screen height probe: renders every tab's panel at the real width so we
         can reserve the tallest height and keep the frame fixed across tabs.
         Mirrors the .rt__detail markup above; keep the two in sync. -->
    <div class="rt__measure" aria-hidden="true" ref="measureEl">
      <div
        v-for="(it, i) in items"
        :key="'m' + i"
        class="rt__detail"
        :class="{ 'rt__detail--card': it.card }"
      >
        <div v-if="it.head || it.no || it.q || it.tag" class="rt__head rt__block">
          <span v-if="it.head" class="rt__badge" v-html="it.head" />
          <span v-else class="rt__badge">
            <template v-if="it.no">{{ it.no }} </template>{{ it.key
            }}<template v-if="it.tag"> · {{ it.tag }}</template>
          </span>
          <span v-if="it.q" class="rt__q" v-html="it.q" />
        </div>
        <div class="rt__viewport rt__viewport--single">
          <div class="rt__track">
            <p v-if="it.lead" class="rt__lead rt__block" v-html="it.lead" :style="{ minHeight: leadMinH ? leadMinH + 'px' : undefined }" />
            <div v-if="it.points || it.pros || it.cons" class="rt__main rt__block">
              <ul v-if="it.points" class="rt__points">
                <li v-for="p in it.points" :key="p" v-html="p" />
              </ul>
              <div v-if="it.pros || it.cons" class="rt__pc">
                <div v-for="p in it.pros" :key="p" class="pro" v-html="p" />
                <div v-for="c in it.cons" :key="c" class="con" v-html="c" />
              </div>
            </div>
            <div v-if="it.chips" class="rt__foot rt__block">
              <div class="rt__chips">
                <span v-for="c in it.chips" :key="c" class="chip">{{ c }}</span>
              </div>
            </div>
          </div>
        </div>
        <aside v-if="it.card" class="rt__card" :style="{ minHeight: cardMinH ? cardMinH + 'px' : undefined }">
          <div class="rt__card-t" v-html="it.card.title" />
          <div class="rt__card-b" v-html="it.card.body" />
          <div v-if="it.card.note" class="rt__card-n" v-html="it.card.note" />
        </aside>
      </div>
    </div>

    <div class="rt__bar">
      <Cite v-if="curSources.length" :items="curSources" place="bar"
            :now="props.items[sel]?.now" />
      <span v-else class="rt__hint" aria-hidden="true">▸ カードをクリック / ◂▸ キーで切り替え</span>
      <div v-if="pageCount > 1" class="rt__pager" role="group" aria-label="説明のページ送り">
        <button
          class="rt__pbtn"
          :disabled="page === 0"
          aria-label="前のページ"
          @click="goPage(page - 1)"
        >‹</button>
        <button
          v-for="p in pageCount"
          :key="p"
          class="rt__pdot"
          :class="{ on: page === p - 1 }"
          :aria-label="'ページ ' + p + ' / ' + pageCount"
          :aria-current="page === p - 1"
          @click="goPage(p - 1)"
        />
        <button
          class="rt__pbtn"
          :disabled="page === pageCount - 1"
          aria-label="次のページ"
          @click="goPage(page + 1)"
        >›</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rt { display: flex; flex-direction: column; gap: .45rem; min-height: 0; position: relative; }
/* off-screen height probe: renders every tab's panel out of flow so we can reserve
   the tallest height. It must actually LAY OUT to be measurable — do NOT collapse it
   with height:0/overflow:hidden. Safari/WKWebView (the app's canvas engine) can skip
   layout for a zero-height clipped subtree, so offsetHeight comes back 0, the reserved
   floor collapses, and heterogeneous tabs (e.g. p13, whose tab③ is one bullet taller)
   shift the title on switch. position:absolute already takes it out of flow so its real
   height never pushes the panel; visibility:hidden + z-index:-1 keep it unpainted, and
   clip-path guarantees zero paint footprint without collapsing the box for layout. */
.rt__measure {
  position: absolute; left: 0; right: 0; top: 0;
  visibility: hidden; pointer-events: none; z-index: -1;
  clip-path: inset(0 0 100% 0);
}
.rt__measure > .rt__detail { margin-bottom: 0; }

/* ---------- tabs (clickable cards) ---------- */
.rt__tabs { display: flex; gap: .6rem; flex: none; margin-bottom: .6rem; }
.rt--row .rt__tabs { flex-wrap: wrap; }
.rt--timeline .rt__tabs { align-items: stretch; gap: .85rem; margin-bottom: .4rem; }
.rt--pair .rt__tabs { display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch; gap: .9rem; }

.rt__tab {
  flex: 1; min-width: 0; text-align: left; cursor: pointer; position: relative;
  border: 1px solid color-mix(in srgb, #fff 8%, var(--line)); border-radius: .7rem;
  padding: .5rem .75rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, .10), rgba(255, 255, 255, .035));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .10), 0 4px 10px -3px rgba(0, 0, 0, .5);
  display: flex; flex-direction: column; gap: .15rem;
  color: inherit; font-family: inherit;
  transition: border-color .25s ease, background .25s ease, box-shadow .25s ease, transform .25s cubic-bezier(.22, 1, .36, 1);
}
.rt__tab:hover {
  border-color: color-mix(in srgb, var(--brand-a) 55%, var(--line));
  background: linear-gradient(180deg, rgba(255, 255, 255, .15), rgba(255, 255, 255, .06));
  transform: translateY(-3px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .12), 0 12px 24px -8px rgba(0, 0, 0, .66);
}
.rt__tab:focus-visible { outline: 2px solid var(--brand-a); outline-offset: 2px; }

.rt__top { display: flex; align-items: center; gap: .5rem; }
.rt__no { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 1.1rem; color: #eef1f8; line-height: 1; }
.rt__k {
  font-weight: 800; font-size: .97rem; color: #eef1f8;
  display: inline-flex; align-items: center; gap: .45rem; line-height: 1.12;
}
.rt__tag { font-family: 'JetBrains Mono', monospace; font-size: .7rem; color: var(--muted); }
.rt__sub { font-size: .78rem; color: var(--ink-soft); line-height: 1.32; }

.rt--pair .rt__tab { padding: .8rem 1rem; }
.rt--pair .rt__k { font-size: 1.15rem; }

/* permanent "いま/NOW" marker — amber = the current era (warm accent on the
   deck's thesis: the Loop era is where we are now). Matches .nowpill. */
.rt__now {
  font-family: 'JetBrains Mono', monospace; font-size: .56rem; font-weight: 800; letter-spacing: .08em;
  color: #1a1205; padding: .1rem .45rem; border-radius: 1rem;
  background: var(--accent-warm);
  border: 1px solid color-mix(in srgb, var(--accent-warm) 80%, #000);
}

/* selected */
.rt__tab.is-sel {
  border-color: var(--brand-a);
  background: linear-gradient(180deg, color-mix(in srgb, var(--brand-a) 28%, transparent), color-mix(in srgb, var(--brand-a) 12%, transparent));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .14), 0 0 0 1px color-mix(in srgb, var(--brand-a) 38%, transparent), 0 8px 20px -7px color-mix(in srgb, var(--brand-a) 60%, transparent);
}
.rt__tab.is-sel.is-now {
  border-color: var(--brand-b);
  background: linear-gradient(180deg, color-mix(in srgb, var(--brand-b) 28%, transparent), color-mix(in srgb, var(--brand-b) 12%, transparent));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .14), 0 0 0 1px color-mix(in srgb, var(--brand-b) 38%, transparent), 0 8px 20px -7px color-mix(in srgb, var(--brand-b) 60%, transparent);
}
/* connector: the active tab points down to the detail panel (selector → content) */
.rt__tab.is-sel::after {
  content: ""; position: absolute; left: 1.5rem; bottom: -.62rem; z-index: 2;
  border-left: .52rem solid transparent; border-right: .52rem solid transparent;
  border-top: .6rem solid var(--brand-a);
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, .35));
}
.rt__tab.is-sel.is-now::after { border-top-color: var(--brand-b); }
.rt--pair .rt__tab.is-sel::after { left: 50%; transform: translateX(-50%); }
.rt__tab.is-sel .rt__k, .rt__tab.is-sel .rt__no {
  background: var(--brand-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.rt__tab.is-sel .rt__k .rt__now { color: #1a1205; -webkit-text-fill-color: #1a1205; }

.rt__arrow { display: flex; align-items: center; color: var(--brand-a); font-weight: 800; }
/* timeline connectors form one continuous "evolution rail": a gradient segment
   links each era, and a pulse relays left → right (Prompt → Context → Harness →
   Loop) so the direction of the transition is felt, not just implied by a glyph. */
.rt--timeline .rt__arrow {
  position: relative; flex: 0 0 1.9rem; align-self: center;
  height: 1.5rem; justify-content: flex-end; align-items: center;
  margin-right: -.85rem; line-height: 1; padding-bottom: .18rem;
  color: color-mix(in srgb, var(--brand-a) 92%, #fff); font-size: 1.3rem; font-weight: 900;
}
.rt--timeline .rt__arrow::before {
  content: ""; position: absolute; left: -1.15rem; right: 0; top: 50%;
  height: 2px; transform: translateY(-50%); border-radius: 2px;
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--brand-a) 90%, transparent) 0%,
    color-mix(in srgb, var(--brand-b) 90%, transparent) 50%,
    color-mix(in srgb, var(--brand-a) 90%, transparent) 100%);
  background-size: 200% 100%;
  box-shadow: 0 0 7px -1px color-mix(in srgb, var(--brand-a) 55%, transparent);
  animation: rt-railshimmer 1.4s linear infinite;
}
/* ONE comet sweeps the whole rail 1→2→3→4 with seamless handoff: three
   connectors share a 2.4s cycle, each lit for its own third (0–0.8s / 0.8–1.6s /
   1.6–2.4s) so a dot is always in flight and never appears to run backward.
   `backwards` fill hides not-yet-started dots; the comet warms cyan→blend→purple
   as it advances (echoes Prompt→Loop) and trails a glow. */
.rt--timeline .rt__arrow::after {
  content: ""; position: absolute; top: 50%; left: -1.15rem;
  width: .46rem; height: .46rem; border-radius: 50%;
  transform: translate(-50%, -50%); background: #ecfdff;
  box-shadow:
    0 0 10px 2px color-mix(in srgb, var(--brand-a) 85%, transparent),
    -.5rem 0 7px -1px color-mix(in srgb, var(--brand-a) 55%, transparent),
    -1.15rem 0 6px -2px color-mix(in srgb, var(--brand-a) 30%, transparent);
  animation: rt-railflow 2.4s linear infinite backwards;
}
.rt--timeline .rt__arrow:nth-of-type(2)::after {
  animation-delay: .8s;
  background: #eef3ff;
  box-shadow:
    0 0 10px 2px color-mix(in srgb, var(--brand-a) 45%, var(--brand-b) 55%),
    -.5rem 0 7px -1px color-mix(in srgb, var(--brand-a) 30%, var(--brand-b) 35%),
    -1.15rem 0 6px -2px color-mix(in srgb, var(--brand-a) 18%, var(--brand-b) 20%);
}
.rt--timeline .rt__arrow:nth-of-type(3)::after {
  animation-delay: 1.6s;
  background: #f5ecff;
  box-shadow:
    0 0 10px 2px color-mix(in srgb, var(--brand-b) 85%, transparent),
    -.5rem 0 7px -1px color-mix(in srgb, var(--brand-b) 55%, transparent),
    -1.15rem 0 6px -2px color-mix(in srgb, var(--brand-b) 30%, transparent);
}
@keyframes rt-railshimmer {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
@keyframes rt-railflow {
  0%   { left: -1.15rem;            opacity: 0; transform: translate(-50%, -50%) scale(.5); }
  10%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  26%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  33%  { left: calc(100% + .35rem); opacity: 0; transform: translate(-50%, -50%) scale(.5); }
  100% { left: calc(100% + .35rem); opacity: 0; transform: translate(-50%, -50%) scale(.5); }
}
@media (prefers-reduced-motion: reduce) {
  .rt--timeline .rt__arrow::before { animation: none; }
  .rt--timeline .rt__arrow::after { animation: none; left: 50%; opacity: .85; }
}
.rt__vs {
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: .8rem;
  color: var(--muted); letter-spacing: .05em;
}

/* ---------- detail panel ---------- */
/* stable stage: holds the reserved height so the out-in tab swap can't collapse
   the frame (which would re-center the slide and nudge the title/大きいパーツ). */
.rt__stage { display: flex; flex-direction: column; position: relative; flex: 0 1 auto; min-height: 0; }
.rt__stage > .rt__detail { flex: 1 1 auto; }
.rt__detail {
  flex: 0 1 auto; min-height: 0; display: flex; flex-direction: column; gap: .5rem;
  border: 1px solid color-mix(in srgb, var(--brand-a) 26%, var(--line));
  border-radius: .85rem; padding: .55rem .95rem;
  background: rgba(255, 255, 255, .015);
  box-shadow: inset 0 2px 10px -3px rgba(0, 0, 0, .55);
}
.rt__detail.is-now { border-color: color-mix(in srgb, var(--brand-b) 30%, var(--line)); }
/* timeline is the densest variant — trim panel vertical padding so the closing line clears the sources bar */
.rt--timeline .rt__detail { padding-top: .42rem; padding-bottom: .42rem; }

/* when an item has a side card, the panel becomes a 2-row grid:
   row 1 = full-width heading (so a long title stays on one line),
   row 2 = [body | side card]. */
.rt__detail--card {
  display: grid; grid-template-columns: 1fr .82fr; grid-template-rows: auto 1fr;
  column-gap: .95rem; row-gap: .4rem; align-items: stretch;
}
.rt__detail--card > .rt__head { grid-column: 1 / -1; grid-row: 1; }
.rt__detail--card > .rt__viewport { grid-column: 1; grid-row: 2; min-height: 0; }
.rt__detail--card > .rt__card { grid-column: 2; grid-row: 2; }

.rt__head { flex: none; display: flex; align-items: baseline; gap: .15rem .6rem; flex-wrap: wrap; }
.rt__badge {
  font-family: 'JetBrains Mono', monospace; font-size: 1.42rem; font-weight: 800; letter-spacing: .005em;
  line-height: 1.18; color: #f4f6fc; word-break: auto-phrase;
}
/* the ONE colored key term inside the heading */
.rt__badge :deep(em) { font-style: normal; font-weight: 800; color: var(--brand-a); white-space: nowrap; }
.rt__detail.is-now .rt__badge :deep(em) { color: color-mix(in srgb, var(--brand-b) 78%, #fff); }
/* muted secondary (English name / category) */
.rt__badge :deep(.rt__en) {
  font-size: .6em; font-weight: 700; letter-spacing: .04em; color: var(--muted); margin-left: .1em;
}
.rt__q { align-self: center; font-size: .92rem; font-weight: 700; color: var(--ink-soft); line-height: 1.4; }
.rt__q :deep(em) { font-style: normal; color: var(--brand-a); }

/* paginated viewport */
.rt__viewport { flex: 1 1 auto; min-height: 0; overflow: hidden; position: relative; display: flex; flex-direction: column; justify-content: flex-start; }
/* the body is top-aligned so its first line stays pinned directly under the
   fixed panel heading — switching tabs never moves the content's top, even when
   tabs have different content heights. Empty space pools at the bottom (accepted
   over any vertical shift; the user's priority is 配置を変えない). */
.rt__viewport--single { justify-content: flex-start; }
.rt__track {
  position: relative;
  display: flex; flex-direction: column; gap: .55rem;
  transition: transform .34s cubic-bezier(.22, 1, .36, 1);
}

.rt__lead { margin: 0; font-size: .95rem; line-height: 1.55; color: var(--ink-soft); }
.rt__lead :deep(strong) { color: #f1f4fc; }

.rt__main { min-width: 0; }

.rt__points { list-style: none; margin: 0; padding: 0; display: grid; gap: .28rem; }
.rt__points li {
  position: relative; padding-left: 1.05rem; font-size: .9rem; line-height: 1.5; color: var(--ink-soft);
}
.rt__points li::before { content: "▸"; position: absolute; left: 0; color: var(--brand-a); font-size: .78rem; }
.rt__points :deep(strong) { color: #eef1f8; }

.rt__pc { display: grid; gap: .25rem; }
.rt__card {
  border: 1px solid color-mix(in srgb, var(--brand-a) 22%, var(--line));
  border-radius: .7rem; padding: .7rem .85rem; background: rgba(255, 255, 255, .02);
  display: flex; flex-direction: column; gap: .35rem; justify-content: flex-start;
}
.rt__detail.is-now .rt__card { border-color: color-mix(in srgb, var(--brand-b) 26%, var(--line)); }
/* align-self:start pins the card's TOP (aligned with the left column's first
   line). Its height is reserved to the tallest card across tabs (cardMinH, set
   from the off-screen probe) and its content is top-aligned (justify-content
   above), so the card box never resizes and its title/body never move when
   switching tabs — only invisible empty space at the card bottom varies. */
.rt__card { align-self: start; }
.rt__card-t { font-weight: 800; font-size: .95rem; color: #f1f4fc; }
.rt__card-b { font-size: .88rem; line-height: 1.5; color: var(--ink-soft); word-break: auto-phrase; }
.rt__card-b :deep(strong) { color: #eef1f8; }
.rt__card-n { font-size: .8rem; line-height: 1.5; color: var(--muted); word-break: auto-phrase; }

.rt__foot { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem .9rem; padding-top: .55rem; border-top: 1px solid var(--line); }
.rt__chips { display: flex; flex-wrap: wrap; gap: .4rem; }

/* ---------- bottom bar: source chip (or hint) on the left, page dots on the right ---------- */
.rt__bar {
  flex: none; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  min-height: 1.1rem;
}
.rt__hint {
  font-family: 'JetBrains Mono', monospace; font-size: .64rem;
  letter-spacing: .04em; color: var(--muted);
}
.rt__pager { display: flex; align-items: center; gap: .45rem; }
.rt__pbtn {
  display: flex; align-items: center; justify-content: center;
  width: 1.35rem; height: 1.35rem; padding: 0; cursor: pointer;
  border: 1px solid var(--line); border-radius: .45rem; background: rgba(255, 255, 255, .03);
  color: var(--ink-soft); font-size: .85rem; line-height: 1;
  transition: border-color .2s ease, color .2s ease, opacity .2s ease;
}
.rt__pbtn:hover:not(:disabled) { border-color: var(--brand-a); color: #fff; }
.rt__pbtn:disabled { opacity: .35; cursor: default; }
.rt__pbtn:focus-visible { outline: 2px solid var(--brand-a); outline-offset: 2px; }
.rt__pdot {
  width: .5rem; height: .5rem; padding: 0; cursor: pointer;
  border: none; border-radius: 50%; background: color-mix(in srgb, var(--ink-soft) 38%, transparent);
  transition: background .2s ease;
}
.rt__pdot:hover { background: color-mix(in srgb, var(--brand-a) 60%, transparent); }
.rt__pdot.on { width: 1.15rem; border-radius: 1rem; background: var(--brand-grad); }
.rt__pdot:focus-visible { outline: 2px solid var(--brand-a); outline-offset: 2px; }

/* ---------- transition ----------
   Tab switch is a pure cross-fade with NO vertical translate: the panel box
   (title / side "吹き出し" card / sources) must never move when switching tabs
   (ユーザー要望「同じページ内で見出しや大きいパーツの配置を動かさない」).
   The .rt__stage wrapper holds the reserved height so the out-in swap gap can't
   collapse the frame and re-center the slide (which would nudge the title). */
.rt-enter-active, .rt-leave-active { transition: opacity .18s ease; }
.rt-enter-from, .rt-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .rt__tab, .rt-enter-active, .rt-leave-active, .rt__track, .rt__pbtn, .rt__pdot { transition: opacity .12s ease; }
  .rt__tab:hover { transform: none; }
}
</style>
