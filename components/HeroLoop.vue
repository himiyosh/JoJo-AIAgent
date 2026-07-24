<script setup lang="ts">
// Cover hero motif: the deck's established four-stage spine inside a wider,
// explicitly provisional Graph topology. Graph stays unnumbered so it cannot
// be read as a settled fifth step after Loop.
defineProps<{ }>()
</script>

<template>
  <div class="hero" aria-hidden="true">
    <svg viewBox="0 0 332 272" class="hero__svg">
      <defs>
        <linearGradient id="hlRing" x1="0" y1="0" x2="332" y2="272" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#22d3ee" />
          <stop offset="1" stop-color="#a855f7" />
        </linearGradient>
        <linearGradient id="hlCore" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#22d3ee" />
          <stop offset="1" stop-color="#a855f7" />
        </linearGradient>
        <radialGradient id="hlGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#22d3ee" stop-opacity="0.22" />
          <stop offset="1" stop-color="#22d3ee" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- provisional topology around the established four-stage loop -->
      <g class="hero__graph" data-layer="graph" data-provisional="true">
        <path class="hero__graph-hull" d="M12 30 L320 30 L326 246 L6 246 Z" />
        <path class="hero__graph-edge" d="M18 62 L166 42" />
        <path class="hero__graph-edge" d="M300 42 L262 138" />
        <path class="hero__graph-edge" d="M316 218 L166 234" />
        <path class="hero__graph-edge" d="M24 232 L70 138" />
        <circle class="hero__graph-node" cx="18" cy="62" r="4.2" />
        <circle class="hero__graph-node" cx="300" cy="42" r="4.2" />
        <circle class="hero__graph-node" cx="316" cy="218" r="4.2" />
        <circle class="hero__graph-node" cx="24" cy="232" r="4.2" />
        <text x="312" y="18" class="hero__graph-label" text-anchor="end">GRAPH?</text>
        <text x="312" y="29" class="hero__graph-note" text-anchor="end">PROVISIONAL</text>
      </g>

      <circle cx="166" cy="138" r="124" fill="url(#hlGlow)" />
      <circle class="hero__loop-ring" cx="166" cy="138" r="96" fill="none" stroke="url(#hlRing)" stroke-width="2" stroke-opacity="0.5" />

      <!-- orbiting comet (clockwise) -->
      <g class="hero__spin">
        <circle cx="233.9" cy="70.1" r="7" fill="#22d3ee" opacity="0.22" />
        <circle cx="233.9" cy="70.1" r="3.2" fill="#eafcff" />
      </g>

      <!-- nodes -->
      <g class="hero__node">
        <circle cx="166" cy="42" r="15" fill="#0b0d15" stroke="#22d3ee" stroke-width="1.6" />
        <text x="166" y="42" class="hero__n">1</text>
      </g>
      <g class="hero__node">
        <circle cx="262" cy="138" r="15" fill="#0b0d15" stroke="#22d3ee" stroke-width="1.6" />
        <text x="262" y="138" class="hero__n">2</text>
      </g>
      <g class="hero__node">
        <circle cx="166" cy="234" r="15" fill="#0b0d15" stroke="#22d3ee" stroke-width="1.6" />
        <text x="166" y="234" class="hero__n">3</text>
      </g>
      <g class="hero__node hero__node--now">
        <circle cx="70" cy="138" r="17" fill="#0b0d15" stroke="#a855f7" stroke-width="1.8" />
        <text x="70" y="138" class="hero__n hero__n--now">4</text>
      </g>

      <!-- stage labels -->
      <text x="166" y="16" class="hero__lab" text-anchor="middle">PROMPT</text>
      <text x="285" y="138" class="hero__lab" text-anchor="start">CONTEXT</text>
      <text x="166" y="260" class="hero__lab" text-anchor="middle">HARNESS</text>
      <text x="47" y="138" class="hero__lab hero__lab--now" text-anchor="end">LOOP</text>

      <!-- pulsing brand-diamond core -->
      <g class="hero__core">
        <rect x="151" y="123" width="30" height="30" rx="6.5" transform="rotate(45 166 138)" fill="url(#hlCore)" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.hero { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.hero__svg {
  position: absolute;
  right: 1%;
  top: 50%;
  transform: translateY(-50%);
  width: 34%;
  height: auto;
  max-height: 92%;
  overflow: visible;
}

.hero__graph-hull {
  fill: none;
  stroke: #a855f7;
  stroke-width: 1.2;
  stroke-opacity: .3;
  stroke-dasharray: 6 7;
}
.hero__graph-edge {
  fill: none;
  stroke: url(#hlRing);
  stroke-width: 1;
  stroke-opacity: .2;
}
.hero__graph-node {
  fill: #0b0d15;
  stroke: #a855f7;
  stroke-width: 1.3;
  stroke-opacity: .72;
}
.hero__graph-label,
.hero__graph-note {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  dominant-baseline: central;
}
.hero__graph-label {
  fill: #d8b4fe;
  font-size: 9px;
  letter-spacing: .14em;
}
.hero__graph-note {
  fill: #8b93a7;
  font-size: 6.5px;
  letter-spacing: .12em;
}

.hero__n {
  fill: #eaf6fb;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  font-size: 15px;
  text-anchor: middle;
  dominant-baseline: central;
}
.hero__n--now { fill: #e9d5ff; font-size: 16px; }

.hero__lab {
  fill: #8b93a7;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.14em;
  dominant-baseline: central;
}
.hero__lab--now { fill: #c4a5f5; }

.hero__node--now circle { filter: drop-shadow(0 0 9px rgba(168, 85, 247, 0.55)); }

.hero__core { transform-box: view-box; transform-origin: 166px 138px; }
.hero__core rect { filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.5)); }

.hero__spin { transform-box: view-box; transform-origin: 166px 138px; animation: heroSpin 16s linear infinite; }
.hero__core { animation: heroPulse 3.4s ease-in-out infinite; }

@keyframes heroSpin { to { transform: rotate(360deg); } }
@keyframes heroPulse {
  0%, 100% { transform: scale(1); opacity: 0.92; }
  50% { transform: scale(1.07); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .hero__spin { animation: none; }
  .hero__core { animation: none; }
}
</style>
