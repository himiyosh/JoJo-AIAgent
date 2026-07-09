<script setup lang="ts">
// Playful concept illustration for the "LLM vs Agent" slide (dev p6).
// A friendly capable assistant robot — brain (visor eyes), hands (a raised
// wave + a wrench), and a loop ring orbiting it = 頭脳＋手足＋段取り, the
// "動ける有能なアシスタント" metaphor. Graphite shell so it reads as a device,
// with a cyan visor + purple core + a cyan→purple loop ring carrying the brand
// gradient (and the ループ theme). Bespoke SVG: no image deps, crisp on Pages,
// animatable. Honors prefers-reduced-motion.
defineProps<{}>()
</script>

<template>
  <div class="bot" aria-hidden="true">
    <svg viewBox="0 0 260 260" class="bot__svg">
      <defs>
        <linearGradient id="asShell" x1="78" y1="78" x2="182" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#3b4d68" />
          <stop offset="1" stop-color="#1b2740" />
        </linearGradient>
        <linearGradient id="asEar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#c084fc" />
          <stop offset="1" stop-color="#a855f7" />
        </linearGradient>
        <linearGradient id="asRing" x1="18" y1="40" x2="242" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#22d3ee" />
          <stop offset="1" stop-color="#a855f7" />
        </linearGradient>
        <radialGradient id="asGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#22d3ee" stop-opacity=".24" />
          <stop offset="1" stop-color="#22d3ee" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="asCore" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#d8b4fe" />
          <stop offset=".5" stop-color="#a855f7" />
          <stop offset="1" stop-color="#7e22ce" />
        </radialGradient>
      </defs>

      <!-- brand glow -->
      <circle cx="130" cy="136" r="126" fill="url(#asGlow)" />

      <!-- orbiting loop ring (= ループ / brand gradient) -->
      <circle cx="130" cy="136" r="110" fill="none" stroke="url(#asRing)" stroke-width="3.4"
              stroke-opacity=".55" stroke-dasharray="2 12" stroke-linecap="round" />
      <g class="bot__orbit">
        <circle cx="130" cy="26" r="7" fill="#22d3ee" />
        <circle cx="130" cy="26" r="12" fill="none" stroke="#22d3ee" stroke-opacity=".4" stroke-width="2" />
        <path d="M138 22l9-3-2 9z" fill="#67e8f9" />
      </g>

      <!-- raised waving hand -->
      <g class="bot__wave">
        <path d="M186 168c10-4 20-14 26-26" fill="none" stroke="url(#asShell)" stroke-width="11" stroke-linecap="round" />
        <circle cx="216" cy="138" r="13" fill="url(#asShell)" stroke="#22d3ee" stroke-opacity=".5" stroke-width="2" />
        <path d="M211 135c2-1 5 0 7 2m-9 6c3 1 7 0 9-2" fill="none" stroke="#22d3ee" stroke-opacity=".7" stroke-width="2" stroke-linecap="round" />
      </g>

      <!-- left arm holding a wrench (= 道具を使う) -->
      <g>
        <path d="M82 176c-9 3-17 9-23 18" fill="none" stroke="url(#asShell)" stroke-width="11" stroke-linecap="round" />
        <g class="bot__tool" fill="none" stroke="#22d3ee" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M54 196l-14 14" />
          <path d="M44 186a9 9 0 1 0 10 12l8 9" stroke-opacity=".95" />
        </g>
      </g>

      <!-- body / shoulders -->
      <rect x="92" y="162" width="76" height="50" rx="17" fill="url(#asShell)" stroke="#22d3ee" stroke-opacity=".28" stroke-width="2" />
      <circle cx="130" cy="187" r="12" fill="url(#asCore)" />
      <circle class="bot__core" cx="130" cy="187" r="17" fill="none" stroke="#a855f7" stroke-opacity=".5" stroke-width="2.4" />

      <!-- robot (gentle float) -->
      <g class="bot__head">
        <!-- antenna -->
        <line x1="130" y1="80" x2="130" y2="58" stroke="#475569" stroke-width="4" stroke-linecap="round" />
        <circle class="bot__ant" cx="130" cy="53" r="6" fill="#22d3ee" />

        <!-- headphone ears -->
        <rect x="64" y="100" width="17" height="40" rx="8.5" fill="url(#asEar)" />
        <rect x="179" y="100" width="17" height="40" rx="8.5" fill="url(#asEar)" />

        <!-- head -->
        <rect x="80" y="80" width="100" height="78" rx="26" fill="url(#asShell)" stroke="#22d3ee" stroke-opacity=".4" stroke-width="2" />
        <!-- visor -->
        <rect x="93" y="94" width="74" height="48" rx="19" fill="#0a0f1c" stroke="#22d3ee" stroke-opacity=".5" stroke-width="1.6" />
        <!-- eyes -->
        <circle class="bot__eye" cx="115" cy="114" r="8" fill="#22d3ee" />
        <circle class="bot__eye" cx="145" cy="114" r="8" fill="#22d3ee" />
        <circle cx="117.6" cy="111.4" r="2.4" fill="#fff" fill-opacity=".95" />
        <circle cx="147.6" cy="111.4" r="2.4" fill="#fff" fill-opacity=".95" />
        <!-- smile -->
        <path d="M117 130c5 6 21 6 26 0" fill="none" stroke="#22d3ee" stroke-opacity=".8" stroke-width="3" stroke-linecap="round" />
        <!-- gloss -->
        <ellipse cx="108" cy="98" rx="16" ry="7" fill="#fff" fill-opacity=".12" transform="rotate(-16 108 98)" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.bot { position: relative; width: 100%; height: 100%; pointer-events: none; }
.bot__svg { width: 100%; height: 100%; overflow: visible; display: block; }

.bot__head { transform-box: view-box; transform-origin: 130px 120px; animation: botFloat 4s ease-in-out infinite; }
.bot__orbit { transform-box: view-box; transform-origin: 130px 136px; animation: botOrbit 7s linear infinite; }
.bot__wave { transform-box: view-box; transform-origin: 178px 172px; animation: botWave 2.8s ease-in-out infinite; }
.bot__ant { transform-box: view-box; transform-origin: 130px 53px; animation: botPulse 2.2s ease-in-out infinite; }
.bot__core { transform-box: view-box; transform-origin: 130px 187px; animation: botPulse 2.6s ease-in-out infinite; }
.bot__eye { animation: botBlink 5.2s ease-in-out infinite; }

@keyframes botFloat {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-6px) rotate(1deg); }
}
@keyframes botOrbit { to { transform: rotate(360deg); } }
@keyframes botWave {
  0%, 60%, 100% { transform: rotate(0deg); }
  30% { transform: rotate(-16deg); }
  45% { transform: rotate(-4deg); }
}
@keyframes botPulse {
  0%, 100% { opacity: .55; transform: scale(.92); }
  50% { opacity: 1; transform: scale(1.08); }
}
@keyframes botBlink {
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(.15); }
}
.bot__eye { transform-box: fill-box; transform-origin: center; }

@media (prefers-reduced-motion: reduce) {
  .bot__head, .bot__orbit, .bot__wave, .bot__ant, .bot__core, .bot__eye { animation: none; }
}
</style>
