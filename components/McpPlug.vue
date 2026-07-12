<script setup lang="ts">
// Playful concept illustration for the MCP slide (dev p11).
// A USB-C "共通プラグ" hub: one standard connector plugs into a central hub
// (the MCP standard) that fans out to many tool chips — the "USB-C のように
// 挿せばつながる" metaphor. Cyan cables carry a flowing data pulse; purple hub
// core anchors the brand gradient. Bespoke SVG: no image deps, crisp on Pages,
// animatable. Honors prefers-reduced-motion.
defineProps<{}>()
</script>

<template>
  <div class="plug" aria-hidden="true">
    <svg viewBox="0 0 280 232" class="plug__svg">
      <defs>
        <linearGradient id="pgMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#cbd5e1" />
          <stop offset=".5" stop-color="#94a3b8" />
          <stop offset="1" stop-color="#64748b" />
        </linearGradient>
        <linearGradient id="pgHub" x1="96" y1="86" x2="184" y2="154" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#1b2740" />
          <stop offset="1" stop-color="#0e1626" />
        </linearGradient>
        <radialGradient id="pgGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#22d3ee" stop-opacity=".22" />
          <stop offset="1" stop-color="#22d3ee" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="pgCore" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#d8b4fe" />
          <stop offset=".5" stop-color="#a855f7" />
          <stop offset="1" stop-color="#7e22ce" />
        </radialGradient>
      </defs>

      <!-- brand glow -->
      <circle cx="140" cy="120" r="120" fill="url(#pgGlow)" />

      <!-- cables (base) -->
      <g fill="none" stroke="#1e3a4a" stroke-width="7" stroke-linecap="round">
        <path d="M116 92C100 66 80 60 58 62" />
        <path d="M140 90C140 70 140 60 140 50" />
        <path d="M164 92C180 66 200 60 222 62" />
        <path d="M140 178C140 198 120 204 104 212" />
      </g>
      <!-- cables (flowing pulse) -->
      <g class="plug__flowwrap" fill="none" stroke="#22d3ee" stroke-width="3" stroke-linecap="round" pathLength="100">
        <path class="plug__flow plug__flow--0" d="M116 92C100 66 80 60 58 62" />
        <path class="plug__flow plug__flow--1" d="M140 90C140 70 140 60 140 50" />
        <path class="plug__flow plug__flow--2" d="M164 92C180 66 200 60 222 62" />
        <path class="plug__flow plug__flow--3" d="M140 178C140 198 120 204 104 212" />
      </g>

      <!-- tool chips -->
      <g class="plug__chips">
        <!-- wrench -->
        <g transform="translate(56 42)">
          <rect x="-21" y="-17" width="42" height="34" rx="9" fill="url(#pgHub)" stroke="#22d3ee" stroke-opacity=".5" stroke-width="2" />
          <path d="M6 -6a8 8 0 1 0-9 11l-4 4 5 5 4-4a8 8 0 0 0 11-9l-5 5-4-1-1-4z" fill="none" stroke="#67e8f9" stroke-width="2.4" stroke-linejoin="round" />
        </g>
        <!-- search -->
        <g transform="translate(140 32)">
          <rect x="-21" y="-17" width="42" height="34" rx="9" fill="url(#pgHub)" stroke="#22d3ee" stroke-opacity=".5" stroke-width="2" />
          <circle cx="-3" cy="-3" r="8" fill="none" stroke="#67e8f9" stroke-width="2.4" />
          <path d="M4 4l8 8" stroke="#67e8f9" stroke-width="2.4" stroke-linecap="round" />
        </g>
        <!-- calendar -->
        <g transform="translate(224 42)">
          <rect x="-21" y="-17" width="42" height="34" rx="9" fill="url(#pgHub)" stroke="#22d3ee" stroke-opacity=".5" stroke-width="2" />
          <rect x="-11" y="-9" width="22" height="18" rx="3" fill="none" stroke="#67e8f9" stroke-width="2.2" />
          <path d="M-11 -3h22" stroke="#67e8f9" stroke-width="2.2" />
          <path d="M-6 -13v6M6 -13v6" stroke="#67e8f9" stroke-width="2.2" stroke-linecap="round" />
        </g>
      </g>

      <!-- central hub (the MCP standard) -->
      <rect x="96" y="86" width="88" height="68" rx="18" fill="url(#pgHub)" stroke="#22d3ee" stroke-opacity=".55" stroke-width="2.4" />
      <circle cx="140" cy="120" r="13" fill="url(#pgCore)" />
      <circle class="plug__core" cx="140" cy="120" r="19" fill="none" stroke="#a855f7" stroke-opacity=".5" stroke-width="2.6" />
      <!-- four ports hinting "any tool fits" -->
      <g fill="#22d3ee" fill-opacity=".5">
        <rect x="104" y="92" width="14" height="5" rx="2.5" />
        <rect x="162" y="92" width="14" height="5" rx="2.5" />
        <rect x="104" y="143" width="14" height="5" rx="2.5" />
        <rect x="162" y="143" width="14" height="5" rx="2.5" />
      </g>

      <!-- the one USB-C plug, inserted from below -->
      <g class="plug__usb">
        <rect x="134" y="150" width="12" height="10" fill="url(#pgMetal)" />
        <rect x="110" y="158" width="60" height="24" rx="12" fill="url(#pgMetal)" stroke="#475569" stroke-width="1.5" />
        <rect x="119" y="165" width="42" height="10" rx="5" fill="#0a0f1c" />
        <!-- short cable stub -->
        <path d="M140 182v8" fill="none" stroke="#334155" stroke-width="9" stroke-linecap="round" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.plug { position: relative; width: 100%; height: 100%; pointer-events: none; }
.plug__svg { width: 100%; height: 100%; overflow: visible; display: block; }

.plug__flow {
  stroke-dasharray: 16 84;
  stroke-dashoffset: 100;
  animation: pgFlow 2.4s linear infinite;
}
.plug__flow--0 { animation-delay: 0s; }
.plug__flow--1 { animation-delay: .5s; }
.plug__flow--2 { animation-delay: 1s; }
.plug__flow--3 { animation-delay: .25s; }
.plug__core { transform-box: view-box; transform-origin: 140px 120px; animation: pgPulse 2.8s ease-in-out infinite; }
.plug__usb { transform-box: view-box; transform-origin: 140px 170px; animation: pgSeat 4s ease-in-out infinite; }

@keyframes pgFlow { to { stroke-dashoffset: 0; } }
@keyframes pgPulse {
  0%, 100% { opacity: .5; transform: scale(.9); }
  50% { opacity: 1; transform: scale(1.08); }
}
@keyframes pgSeat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@media (prefers-reduced-motion: reduce) {
  .plug__flow { animation: none; stroke-dasharray: none; stroke-dashoffset: 0; stroke-opacity: .8; }
  .plug__core, .plug__usb { animation: none; }
}
</style>
