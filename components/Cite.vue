<script setup lang="ts">
import { computed } from 'vue'
// Collapses a slide's citations into one discreet trigger that reveals the links
// on hover / keyboard focus — declutters narrative slides while keeping sources
// one gesture away (HTML affordance the user asked for). Links stay in the DOM
// (screen-reader reachable) and the popover expands inline in print/PDF export,
// so citations are never actually lost.
const props = withDefaults(defineProps<{
  items: { label: string; url: string }[]
  // where the trigger sits on the slide
  place?: 'center' | 'tr' | 'br' | 'inline' | 'bar'
  // trigger glyph
  icon?: 'info' | 'book' | 'quote' | 'link'
  now?: boolean       // purple accent for いま slides
}>(), { place: 'br', icon: 'link' })

// popover opens downward only for the top-right corner; upward elsewhere
const popDir = computed(() => (props.place === 'tr' ? 'down' : 'up'))
</script>

<template>
  <span class="cite" :class="[`cite--${place}`, `cite--pop-${popDir}`, { 'cite--now': now }]"
        tabindex="0" role="button" aria-label="出典を表示">
    <svg class="cite__i" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"
         fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="icon === 'book'">
        <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v13.5H6.5A1.5 1.5 0 0 0 5 19z" />
        <path d="M5 19a1.5 1.5 0 0 0 1.5 1.5H20" />
      </template>
      <template v-else-if="icon === 'quote'">
        <path d="M6 7h4v4.5c0 2.2-1.4 3.7-4 4.3v-2c1.1-.4 1.8-1 1.9-2H6z" fill="currentColor" stroke="none" />
        <path d="M14 7h4v4.5c0 2.2-1.4 3.7-4 4.3v-2c1.1-.4 1.8-1 1.9-2H14z" fill="currentColor" stroke="none" />
      </template>
      <template v-else-if="icon === 'link'">
        <path d="M10 13.5a3.2 3.2 0 0 0 4.5 0l2.5-2.5a3.2 3.2 0 1 0-4.5-4.5l-1 1" />
        <path d="M14 10.5a3.2 3.2 0 0 0-4.5 0L7 13a3.2 3.2 0 1 0 4.5 4.5l1-1" />
      </template>
      <template v-else>
        <circle cx="12" cy="12" r="9.2" />
        <circle cx="12" cy="7.6" r=".2" fill="currentColor" stroke-width="2.2" />
        <path d="M12 11v6" />
      </template>
    </svg>
    <span class="cite__lab">出典</span>
    <span class="cite__pop" role="tooltip">
      <span class="cite__pop-lab" aria-hidden="true">出典 / References</span>
      <a v-for="(s, i) in items" :key="i" class="cite__a" :href="s.url" target="_blank" rel="noopener">
        {{ s.label }} <span class="cite__ext" aria-hidden="true">↗</span>
      </a>
    </span>
  </span>
</template>

<style scoped>
.cite {
  --c: color-mix(in srgb, var(--brand-a) 82%, var(--ink-soft));
  position: relative; display: inline-flex; align-items: center; gap: .32em;
  font-family: 'JetBrains Mono', monospace; font-size: .72rem; font-weight: 600;
  letter-spacing: .02em; color: var(--muted); cursor: default;
  padding: .2em .55em; border-radius: 1em;
  border: 1px solid var(--line); background: color-mix(in srgb, #fff 3%, transparent);
  transition: color .16s ease, border-color .16s ease, background .16s ease;
  outline: none; vertical-align: middle;
}
.cite--now { --c: color-mix(in srgb, var(--brand-b) 82%, var(--ink-soft)); }
.cite__i { opacity: .82; flex: none; }
.cite:hover, .cite:focus-visible {
  color: var(--c); border-color: color-mix(in srgb, var(--c) 45%, var(--line));
  background: color-mix(in srgb, var(--c) 9%, transparent);
}
.cite:focus-visible { outline: 2px solid var(--c); outline-offset: 2px; }

/* ---- placements ---- */
/* corner-pinned variants anchor to the slide (a positioned ancestor exists,
   same mechanism as .srcfoot) so they never sit on top of body copy. */
.cite--tr { position: absolute; top: 2.5rem; right: 2.7rem; z-index: 30; }
/* lifted clear of the persistent page-number footer (.deck-foot ≈ bottom .95rem) */
.cite--br { position: absolute; right: 3rem; bottom: 2.5rem; z-index: 30; }
.cite--inline {
  font-size: .6rem; padding: .1em .45em; gap: .25em;
  vertical-align: .35em; margin-left: .3em;   /* superscript-ish marker */
}

/* ---- popover ---- */
.cite__pop {
  position: absolute; left: 50%; z-index: 40;
  width: max-content; max-width: min(34rem, 78vw);
  display: flex; flex-direction: column; gap: .28rem;
  padding: .7rem .85rem; border-radius: .7rem;
  background: color-mix(in srgb, var(--bg-1) 94%, #000);
  border: 1px solid color-mix(in srgb, var(--c) 32%, var(--line));
  box-shadow: 0 18px 44px -14px rgba(0, 0, 0, .8),
    0 0 0 1px color-mix(in srgb, var(--c) 12%, transparent);
  opacity: 0; visibility: hidden; pointer-events: none;
  transition: opacity .16s ease, transform .18s cubic-bezier(.22, 1, .36, 1), visibility .16s;
  text-align: left;
}
.cite--pop-up .cite__pop { bottom: calc(100% + .55rem); transform: translate(-50%, 5px); }
.cite--pop-down .cite__pop { top: calc(100% + .55rem); transform: translate(-50%, -5px); }
/* corner variants: right-align the popover to the chip so it stays on-canvas */
.cite--tr .cite__pop, .cite--br .cite__pop { left: auto; right: 0; }
.cite--tr .cite__pop { transform: translate(0, -5px); }
.cite--br .cite__pop { transform: translate(0, 5px); }
/* bar variant: chip flows inline in the RevealTabs source bar (stays relative,
   not corner-pinned); popover opens up and left-aligns to the chip. */
.cite--bar .cite__pop { left: 0; right: auto; transform: translate(0, 5px); }
.cite:hover .cite__pop, .cite:focus-within .cite__pop {
  opacity: 1; visibility: visible; pointer-events: auto; transform: translate(-50%, 0);
}
.cite--tr:hover .cite__pop, .cite--tr:focus-within .cite__pop,
.cite--br:hover .cite__pop, .cite--br:focus-within .cite__pop { transform: translate(0, 0); }
.cite--bar:hover .cite__pop, .cite--bar:focus-within .cite__pop { transform: translate(0, 0); }

/* pointer */
.cite__pop::after {
  content: ""; position: absolute; left: 50%; width: 10px; height: 10px;
  margin-left: -5px; transform: rotate(45deg);
  background: color-mix(in srgb, var(--bg-1) 94%, #000);
  border: 1px solid color-mix(in srgb, var(--c) 32%, var(--line));
}
.cite--pop-up .cite__pop::after { bottom: -6px; border-top: 0; border-left: 0; }
.cite--pop-down .cite__pop::after { top: -6px; border-bottom: 0; border-right: 0; }
.cite--tr .cite__pop::after, .cite--br .cite__pop::after { left: auto; right: 14px; margin-left: 0; }
.cite--bar .cite__pop::after { left: 14px; right: auto; margin-left: 0; }

/* invisible hover-bridge: fills the .55rem gap between chip and popover so the
   pointer can travel onto the links without crossing a dead zone that drops
   :hover and closes the popover mid-reach. Only active while the popover is
   open (it inherits the popover's pointer-events), so it never blocks the deck. */
.cite__pop::before {
  content: ""; position: absolute; left: 0; right: 0; height: .8rem;
}
.cite--pop-up .cite__pop::before { top: 100%; }
.cite--pop-down .cite__pop::before { bottom: 100%; }

.cite__pop-lab {
  font-family: 'JetBrains Mono', monospace; font-size: .6rem; font-weight: 800;
  letter-spacing: .14em; text-transform: uppercase; color: var(--c); margin-bottom: .1rem;
}
.cite__a {
  font-family: 'JetBrains Mono', monospace; font-size: .78rem; line-height: 1.45;
  color: var(--ink-soft); text-decoration: none; border-bottom: 1px solid transparent;
  align-self: flex-start;
}
.cite__a:hover { color: #fff; border-bottom-color: color-mix(in srgb, var(--c) 60%, transparent); }
.cite__ext { color: var(--c); font-size: .9em; }

@media (prefers-reduced-motion: reduce) {
  .cite, .cite__pop { transition: opacity .1s ease; }
  .cite__pop { transform: translate(-50%, 0) !important; }
  .cite--tr .cite__pop, .cite--br .cite__pop { transform: translate(0, 0) !important; }
  .cite--bar .cite__pop { transform: translate(0, 0) !important; }
}

/* Print / PDF export: expand inline so citations survive static export. */
@media print {
  .cite--tr, .cite--br { position: static; }
  .cite__pop {
    position: static; opacity: 1; visibility: visible; transform: none !important;
    box-shadow: none; margin-top: .3rem; max-width: none;
  }
  .cite__pop::after { display: none; }
}
</style>
