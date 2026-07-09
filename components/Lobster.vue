<script setup lang="ts">
// Playful mascot for the Loop-trend slide (p16), tucked beside Peter
// Steinberger's post — a visual pun on his "OpenClaw" project (claw = はさみ).
// Top-down lobster in the deck's rose role-token, with cyan claw-edge
// highlights + antennae tips anchoring it to the brand. Bespoke SVG, no image
// deps. One claw lazily snaps open/closed. Honors prefers-reduced-motion.
defineProps<{}>()
</script>

<template>
  <div class="lob" aria-hidden="true">
    <svg viewBox="0 0 220 250" class="lob__svg">
      <defs>
        <linearGradient id="lbBody" x1="60" y1="30" x2="170" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fda4af" />
          <stop offset=".5" stop-color="#fb7185" />
          <stop offset="1" stop-color="#e11d48" />
        </linearGradient>
        <radialGradient id="lbGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#fb7185" stop-opacity=".22" />
          <stop offset="1" stop-color="#fb7185" stop-opacity="0" />
        </radialGradient>
      </defs>

      <circle cx="110" cy="128" r="118" fill="url(#lbGlow)" />

      <!-- antennae -->
      <g class="lob__ant" fill="none" stroke-width="3" stroke-linecap="round">
        <path d="M98 78C82 48 70 30 58 14" stroke="#fb7185" />
        <path d="M122 78c16-30 28-48 40-64" stroke="#fb7185" />
        <circle cx="58" cy="14" r="3.6" fill="#22d3ee" stroke="none" />
        <circle cx="162" cy="14" r="3.6" fill="#22d3ee" stroke="none" />
      </g>

      <!-- legs -->
      <g stroke="#e11d48" stroke-width="4" stroke-linecap="round" opacity=".85">
        <path d="M86 150c-22 6-36 16-46 30" />
        <path d="M88 166c-20 10-32 22-40 38" />
        <path d="M134 150c22 6 36 16 46 30" />
        <path d="M132 166c20 10 32 22 40 38" />
      </g>

      <!-- left claw (static) -->
      <g>
        <path d="M92 124C70 120 50 112 40 100" fill="none" stroke="url(#lbBody)" stroke-width="13" stroke-linecap="round" />
        <path d="M44 104c-12-10-20-26-16-42 12 2 24 12 30 24 6-6 8-2 6 6 10 2 18 10 18 20-14 6-30 4-38-8z" fill="url(#lbBody)" />
        <path d="M28 62c10 2 21 11 27 22" fill="none" stroke="#22d3ee" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round" />
      </g>

      <!-- right claw (movable upper prong snaps) -->
      <g>
        <path d="M128 124c22-4 42-12 52-24" fill="none" stroke="url(#lbBody)" stroke-width="13" stroke-linecap="round" />
        <g class="lob__claw">
          <path d="M176 100c12-10 20-26 16-42-12 2-24 12-30 24-3-3-5-2-5 3z" fill="url(#lbBody)" />
          <path d="M192 60c-10 2-21 11-27 22" fill="none" stroke="#22d3ee" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round" />
        </g>
        <path d="M157 109c-10 2-18 10-18 20 14 6 30 4 38-8 4-7 4-15 1-21-7 1-15 5-21 9z" fill="url(#lbBody)" />
      </g>

      <!-- carapace / head -->
      <path d="M110 70c16 0 27 12 27 30 0 14-6 24-6 34 0 0-9 6-21 6s-21-6-21-6c0-10-6-20-6-34 0-18 11-30 27-30z" fill="url(#lbBody)" />
      <!-- eyes -->
      <circle cx="99" cy="92" r="5.4" fill="#3f0a16" />
      <circle cx="121" cy="92" r="5.4" fill="#3f0a16" />
      <circle cx="100.6" cy="90" r="1.8" fill="#22d3ee" fill-opacity=".9" />
      <circle cx="122.6" cy="90" r="1.8" fill="#22d3ee" fill-opacity=".9" />
      <!-- gloss -->
      <ellipse cx="100" cy="80" rx="10" ry="6" fill="#fff" fill-opacity=".26" transform="rotate(-22 100 80)" />

      <!-- abdomen segments -->
      <g class="lob__tail">
        <path d="M89 138h42l-3 16H92z" fill="url(#lbBody)" />
        <path d="M91 156h38l-3 16H94z" fill="url(#lbBody)" />
        <path d="M93 174h34l-3 16H96z" fill="url(#lbBody)" />
        <path d="M95 192h30l-2 14H97z" fill="url(#lbBody)" />
        <!-- tail fan -->
        <g fill="url(#lbBody)">
          <path d="M110 206c-8 8-20 12-30 10 4-10 10-18 18-22z" />
          <path d="M110 206c8 8 20 12 30 10-4-10-10-18-18-22z" />
          <path d="M110 206c-4 10-4 22 0 32 4-10 4-22 0-32z" />
          <path d="M110 207c-6 9-14 16-24 18 2-9 8-17 16-22z" opacity=".85" />
          <path d="M110 207c6 9 14 16 24 18-2-9-8-17-16-22z" opacity=".85" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.lob { position: relative; width: 100%; height: 100%; pointer-events: none; }
.lob__svg { width: 100%; height: 100%; overflow: visible; display: block; }

.lob__claw { transform-box: view-box; transform-origin: 162px 104px; animation: lobSnap 3.6s ease-in-out infinite; }
.lob__ant { transform-box: view-box; transform-origin: 110px 80px; animation: lobAnt 4.2s ease-in-out infinite; }

@keyframes lobSnap {
  0%, 70%, 100% { transform: rotate(0deg); }
  82% { transform: rotate(-15deg); }
  90% { transform: rotate(-3deg); }
}
@keyframes lobAnt {
  0%, 100% { transform: rotate(-2.5deg); }
  50% { transform: rotate(2.5deg); }
}

@media (prefers-reduced-motion: reduce) {
  .lob__claw, .lob__ant { animation: none; }
}
</style>
