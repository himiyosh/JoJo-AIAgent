<script setup lang="ts">
// Small, shared connection-shape glyph for the "4つの型" slide (dev p22).
//
// Purpose: the four pattern cards read almost identically (icon ＋ one line of
// copy), so the *structural* difference between the patterns is invisible. This
// glyph draws the wiring — how the agents connect — so each型 is told apart by
// SHAPE and ARROW DIRECTION, not colour alone:
//
//   routing        1 → (choose 1 of many)        fan-out from one source
//   orchestrator   1 → many, then aggregate       hub over a row of workers
//   handoff        A → B → C                       a straight chain
//   evaluator      A ⇄ B (make / critique)         a two-node cycle
//
// It inherits the card's accent via `currentColor` (each .ptn sets --c), stays
// text-free, and does NOT use the `ico` class — so the Reader keeps extracting
// the existing Ico as the card icon and this glyph never pollutes the extracted
// text. Projection / on-brand only; no image deps.

type Pattern = 'routing' | 'orchestrator' | 'handoff' | 'evaluator'
const props = defineProps<{ type: Pattern }>()

type Node = { x: number; y: number; r: number; solid?: boolean }
type Line = { d: string; dim?: boolean }
type Head = { x: number; y: number; a: number }

// arrowhead polygon points for a tip at (x,y) pointing along angle `a` (deg)
function head(x: number, y: number, a: number): string {
  const rad = (a * Math.PI) / 180
  const back = 5, half = 3
  const bx = x - back * Math.cos(rad)
  const by = y - back * Math.sin(rad)
  const nx = -Math.sin(rad), ny = Math.cos(rad)
  const p1 = `${(bx + half * nx).toFixed(1)},${(by + half * ny).toFixed(1)}`
  const p2 = `${(bx - half * nx).toFixed(1)},${(by - half * ny).toFixed(1)}`
  return `${x},${y} ${p1} ${p2}`
}

const ang = (x1: number, y1: number, x2: number, y2: number) =>
  (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI

interface Spec { nodes: Node[]; lines: Line[]; heads: Head[]; label: string }

const SPECS: Record<Pattern, Spec> = {
  routing: {
    label: '1つの入口から得意な担当へ振り分ける形',
    nodes: [
      { x: 11, y: 22, r: 6.5, solid: true },
      { x: 83, y: 8, r: 5 }, { x: 83, y: 22, r: 5 }, { x: 83, y: 36, r: 5 },
    ],
    lines: [
      { d: 'M18 22 74 9' }, { d: 'M18 22 75 22' }, { d: 'M18 22 74 35' },
    ],
    heads: [
      { x: 74, y: 9, a: ang(18, 22, 74, 9) },
      { x: 75, y: 22, a: 0 },
      { x: 74, y: 35, a: ang(18, 22, 74, 35) },
    ],
  },
  orchestrator: {
    label: '親が割り振り、ワーカーの結果を集約する形',
    nodes: [
      { x: 47, y: 7, r: 6.5, solid: true },
      { x: 18, y: 36, r: 5 }, { x: 47, y: 36, r: 5 }, { x: 76, y: 36, r: 5 },
    ],
    lines: [
      { d: 'M45 13 22 30' }, { d: 'M47 14 47 30' }, { d: 'M49 13 72 30' },
      { d: 'M72 32 C68 22 60 15 53 11', dim: true },
    ],
    heads: [
      { x: 22, y: 30, a: ang(45, 13, 22, 30) },
      { x: 47, y: 30, a: 90 },
      { x: 72, y: 30, a: ang(49, 13, 72, 30) },
      { x: 53, y: 11, a: ang(60, 15, 53, 11) },
    ],
  },
  handoff: {
    label: '担当を順に引き継ぐ一直線の形',
    nodes: [
      { x: 11, y: 22, r: 6.5, solid: true },
      { x: 47, y: 22, r: 6.5 }, { x: 83, y: 22, r: 6.5 },
    ],
    lines: [{ d: 'M18 22 39 22' }, { d: 'M54 22 75 22' }],
    heads: [{ x: 40, y: 22, a: 0 }, { x: 76, y: 22, a: 0 }],
  },
  evaluator: {
    label: '作る役と直す役を往復するループの形',
    nodes: [
      { x: 30, y: 22, r: 7, solid: true }, { x: 64, y: 22, r: 7 },
    ],
    lines: [
      { d: 'M31 15 C42 6 52 6 62 14' },
      { d: 'M63 29 C52 38 42 38 32 30' },
    ],
    heads: [
      { x: 62, y: 14, a: ang(52, 6, 62, 14) },
      { x: 32, y: 30, a: ang(42, 38, 32, 30) },
    ],
  },
}

const spec = SPECS[props.type]
</script>

<template>
  <svg class="pglyph" viewBox="0 0 94 44" :aria-label="spec.label" role="img">
    <g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path v-for="(l, i) in spec.lines" :key="'l' + i" :d="l.d" :stroke-opacity="l.dim ? 0.42 : 0.85"
        :stroke-dasharray="l.dim ? '2.6 2.6' : undefined" />
    </g>
    <polygon v-for="(h, i) in spec.heads" :key="'h' + i" :points="head(h.x, h.y, h.a)"
      fill="currentColor" :fill-opacity="0.9" />
    <circle v-for="(n, i) in spec.nodes" :key="'n' + i" :cx="n.x" :cy="n.y" :r="n.r"
      :fill="n.solid ? 'currentColor' : 'rgba(255,255,255,.04)'"
      :fill-opacity="n.solid ? 0.9 : 1"
      stroke="currentColor" :stroke-opacity="n.solid ? 0 : 0.75" stroke-width="1.5" />
  </svg>
</template>

<style scoped>
.pglyph {
  flex: none;
  width: 5.4rem;
  height: auto;
  color: var(--c, var(--brand-a));
  align-self: center;
}
</style>
