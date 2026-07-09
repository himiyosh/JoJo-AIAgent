<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useNav } from '@slidev/client'
import { activeTerm, termHits, originPage, TERM_IDS } from './composables/glossary'

// This deck's content is Japanese. Declaring the document language lets
// screen readers pronounce it correctly, selects Japanese glyph variants,
// and enables `word-break: auto-phrase` to break lines at natural 文節
// boundaries (avoids mid-word wraps in narrow cards).
useHead({ htmlAttrs: { lang: 'ja' } })

// ---- Glossary jump: inline `.gterm` links navigate to the 用語集 slide ----
const nav = useNav()

function glossaryNo(): number | undefined {
  return nav.slides.value.find(
    s => s.meta?.slide?.frontmatter?.routeAlias === 'glossary',
  )?.no
}

async function jump(term: string) {
  const gno = glossaryNo()
  const cur = nav.currentSlideNo.value
  if (gno && cur !== gno) originPage.value = cur   // remember where we came from
  await nav.go('glossary')
  activeTerm.value = term
  termHits.value++                                 // retrigger highlight even for same term
}

function termFrom(e: Event): string | null {
  const t = (e.target as HTMLElement | null)?.closest<HTMLElement>('.gterm')
  const id = t?.dataset.term
  return id && TERM_IDS.has(id) ? id : null
}

function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0) return
  const id = termFrom(e)
  if (!id) return
  e.preventDefault()
  e.stopPropagation()
  jump(id)
}

function onKey(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const id = termFrom(e)
  if (!id) return
  e.preventDefault()
  e.stopPropagation()
  jump(id)
}

// ---- Deck frame: chapter wayfinding label for the persistent footer ----
// Reads the nearest `chapter:` frontmatter at or before the current slide.
// Structure-only adoption from the reference deck; brand tokens unchanged.
const FALLBACK_LABEL = 'AIエージェント入門'
const footLabel = computed(() => {
  const cur = nav.currentSlideNo.value
  let bestNo = -1
  let label = FALLBACK_LABEL
  for (const s of nav.slides.value) {
    const ch = s.meta?.slide?.frontmatter?.chapter
    if (ch && s.no <= cur && s.no > bestNo) { bestNo = s.no; label = String(ch) }
  }
  return label
})
// The cover carries its own bespoke footer (author + #01 badge); no chrome there.
const isCover = computed(() => nav.currentSlideNo.value === 1)
// The closing slide is a bookend (its own centered lockup) — keep it chrome-light too.
const isClosing = computed(() => nav.currentSlideNo.value === nav.slides.value.length)

// Runtime footer suppression: a few dense slides (quote walls, the glossary grid)
// fill content down to the baseline where the footer sits. Those slides opt out
// deterministically via `foot: false` frontmatter — no timing-sensitive DOM
// measurement, so it holds on fresh loads, print/export, and slow font swaps.
const footOptOut = computed(() => {
  const cur = nav.currentSlideNo.value
  const s = nav.slides.value.find(sl => sl.no === cur)
  return s?.meta?.slide?.frontmatter?.foot === false
})
const hideFoot = computed(() => isCover.value || isClosing.value || footOptOut.value)

// Make inline 用語 links keyboard-focusable + labelled. Runs on mount and after
// every slide change (newly mounted slides bring their own .gterm anchors).
function decorate() {
  document.querySelectorAll<HTMLElement>('.gterm:not([data-gdec])').forEach((el) => {
    el.dataset.gdec = '1'
    el.setAttribute('role', 'link')
    el.setAttribute('tabindex', '0')
    el.setAttribute('title', '用語集で見る')
    const label = el.textContent?.trim()
    if (label) el.setAttribute('aria-label', `${label}（用語集へ移動）`)
  })
}

onMounted(() => {
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKey, true)
  decorate()
})
watch(() => nav.currentSlideNo.value, () => nextTick(decorate))
onBeforeUnmount(() => {
  document.removeEventListener('click', onClick, true)
  document.removeEventListener('keydown', onKey, true)
})
</script>

<template>
  <div class="gb">
    <!-- top brand ribbon: full-width cyan→purple frame on every slide -->
    <div class="deck-ribbon" aria-hidden="true" />
    <!-- footer: chapter wayfinding (left) + page number (right); yields on cover,
         the closing bookend, and any slide whose content fills the baseline -->
    <div v-if="!hideFoot" class="deck-foot" aria-hidden="true">
      <span class="deck-foot__label">{{ footLabel }}</span>
      <span class="deck-foot__page"><SlideCurrentNo /><span class="deck-foot__sep">/</span><SlidesTotal /></span>
    </div>
  </div>
</template>

<style scoped>
.gb { position: absolute; inset: 0; pointer-events: none; z-index: 20; }

/* Top brand ribbon — a thin full-width cyan→purple hairline that frames the
   whole deck. Master-level top framing (NOT a side-stripe): brand-safe. */
.deck-ribbon {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg,
    var(--brand-a),
    color-mix(in srgb, var(--brand-a) 45%, var(--brand-b)) 55%,
    var(--brand-b));
  opacity: .92;
}

/* Persistent footer — chapter label + page number, in the bottom padding zone.
   Adopted structure from the reference deck; sits below all slide content. */
.deck-foot {
  position: absolute; left: 3rem; right: 3rem; bottom: .95rem;
  display: flex; align-items: baseline; justify-content: space-between; gap: 1rem;
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
}
.deck-foot__label {
  min-width: 0; letter-spacing: .04em;
  color: color-mix(in srgb, var(--muted) 78%, transparent);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.deck-foot__page {
  flex-shrink: 0; letter-spacing: .14em;
  color: rgba(180, 190, 210, .45);
}
.deck-foot__sep { opacity: .5; margin: 0 3px; }
</style>
