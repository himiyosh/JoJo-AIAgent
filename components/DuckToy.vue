<script setup lang="ts">
// Playful concept illustration for the Rubberduck slide (p18).
// A glossy rubber-duck toy bobbing on a cyan ripple — the "explain it to the
// duck and you realize it yourself" motif. Representational amber/orange local
// palette (reusing the deck's --c am/ro role tokens) anchored to the brand via
// cyan water + glow + a twinkling aha-spark. Bespoke SVG: zero image deps,
// crisp on Pages, themeable, animatable. Honors prefers-reduced-motion.
defineProps<{}>()
</script>

<template>
  <div class="duck" aria-hidden="true">
    <svg viewBox="14 6 258 226" class="duck__svg">
      <defs>
        <linearGradient id="dkBody" x1="40" y1="40" x2="210" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fef3c7" />
          <stop offset=".45" stop-color="#fbbf24" />
          <stop offset="1" stop-color="#f59e0b" />
        </linearGradient>
        <linearGradient id="dkBeak" x1="210" y1="76" x2="256" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fdba74" />
          <stop offset="1" stop-color="#f97316" />
        </linearGradient>
        <radialGradient id="dkGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#22d3ee" stop-opacity=".26" />
          <stop offset="1" stop-color="#22d3ee" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="dkWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#22d3ee" stop-opacity=".34" />
          <stop offset="1" stop-color="#22d3ee" stop-opacity=".06" />
        </linearGradient>
      </defs>

      <!-- brand glow -->
      <circle cx="138" cy="138" r="130" fill="url(#dkGlow)" />

      <!-- water ripples -->
      <g class="duck__ripple">
        <ellipse cx="138" cy="212" rx="104" ry="15" fill="none" stroke="#22d3ee" stroke-opacity=".5" stroke-width="2" />
        <ellipse class="duck__r2" cx="138" cy="212" rx="76" ry="10" fill="none" stroke="#22d3ee" stroke-opacity=".34" stroke-width="1.6" />
      </g>
      <ellipse cx="138" cy="214" rx="98" ry="13" fill="url(#dkWater)" />

      <!-- duck (bobbing) -->
      <g class="duck__body">
        <!-- tail flick -->
        <path d="M58 158C42 150 30 142 20 136c14 12 18 24 24 36 8-4 12-8 14-14z" fill="url(#dkBody)" />
        <!-- body blob -->
        <ellipse cx="124" cy="156" rx="82" ry="60" fill="url(#dkBody)" />
        <!-- head -->
        <circle cx="184" cy="92" r="46" fill="url(#dkBody)" />
        <!-- upper beak -->
        <path d="M222 84c22-3 38 2 41 9-4 5-22 8-41 6-3-5-3-10 0-15z" fill="url(#dkBeak)" />
        <!-- lower beak -->
        <path d="M222 100c19-1 33 1 37 5-5 6-22 7-37 5-2-3-2-7 0-10z" fill="#ea7a17" />
        <!-- wing -->
        <path d="M92 142c26-10 60-7 84 9-18 13-46 16-72 9-9-5-13-11-12-18z" fill="#f59e0b" fill-opacity=".55" />
        <path d="M92 142c26-10 60-7 84 9" fill="none" stroke="#d97706" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" />
        <!-- cheek blush -->
        <ellipse cx="206" cy="108" rx="11" ry="7" fill="#fb7185" fill-opacity=".34" />
        <!-- eye -->
        <circle cx="196" cy="80" r="7.4" fill="#171019" />
        <circle cx="199" cy="77" r="2.4" fill="#fff" fill-opacity=".95" />
        <circle cx="193" cy="83" r="1.5" fill="#22d3ee" fill-opacity=".8" />
        <!-- gloss -->
        <ellipse cx="160" cy="66" rx="24" ry="13" fill="#fff" fill-opacity=".34" transform="rotate(-18 160 66)" />
        <ellipse cx="92" cy="138" rx="20" ry="11" fill="#fff" fill-opacity=".16" transform="rotate(-14 92 138)" />
      </g>

      <!-- aha spark thought-bubble -->
      <g class="duck__think">
        <circle cx="232" cy="46" r="3.4" fill="#22d3ee" fill-opacity=".55" />
        <circle cx="244" cy="34" r="4.6" fill="#22d3ee" fill-opacity=".7" />
        <g class="duck__spark">
          <circle cx="258" cy="20" r="13" fill="#0b0d15" stroke="#22d3ee" stroke-opacity=".6" stroke-width="1.4" />
          <path d="M258 11.5l2.3 4.6 4.6 2.3-4.6 2.3-2.3 4.6-2.3-4.6-4.6-2.3 4.6-2.3z" fill="#22d3ee" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.duck { position: relative; width: 100%; height: 100%; pointer-events: none; }
.duck__svg { width: 100%; height: 100%; overflow: visible; display: block; }

.duck__body { transform-box: view-box; transform-origin: 130px 160px; animation: duckBob 3.4s ease-in-out infinite; }
.duck__ripple { transform-box: view-box; transform-origin: 138px 212px; animation: duckRipple 3.4s ease-in-out infinite; }
.duck__r2 { transform-box: view-box; transform-origin: 138px 212px; animation: duckRipple2 3.4s ease-in-out infinite; }
.duck__spark { transform-box: view-box; transform-origin: 258px 20px; animation: duckSpark 2.6s ease-in-out infinite; }

@keyframes duckBob {
  0%, 100% { transform: translateY(0) rotate(-1.6deg); }
  50% { transform: translateY(-7px) rotate(1.4deg); }
}
@keyframes duckRipple {
  0%, 100% { transform: scaleX(1); opacity: .9; }
  50% { transform: scaleX(1.06); opacity: .6; }
}
@keyframes duckRipple2 {
  0%, 100% { transform: scaleX(1.05); opacity: .5; }
  50% { transform: scaleX(.92); opacity: .85; }
}
@keyframes duckSpark {
  0%, 100% { transform: scale(.82); opacity: .45; }
  55% { transform: scale(1.08); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .duck__body, .duck__ripple, .duck__r2, .duck__spark { animation: none; }
}
</style>
