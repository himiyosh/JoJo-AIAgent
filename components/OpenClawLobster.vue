<!--
  OpenClawLobster.vue — OpenClaw 公式マスコット（ドット絵ロブスター）を忠実にインライン化。
  画素データ・配色は公式アセットそのまま（改変なし）。ブランド係留は背後の cyan ハロー“だけ”で行い、
  ロブスター本体の色（#ff4f40 等）は一切変えない＝「本物」を尊重。

  出典 / Attribution（MIT — 配布時に著作権・許諾表示を同梱）:
    OpenClaw — docs/assets/pixel-lobster.svg
    https://github.com/openclaw/openclaw  (raw: /main/docs/assets/pixel-lobster.svg)
    MIT License — Copyright (c) 2026 OpenClaw Foundation
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction … (full text: project LICENSE)
-->
<template>
  <div class="oclob" role="img" aria-label="OpenClaw 公式マスコット（ロブスター）">
    <svg class="oclob__art" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <!-- outline -->
      <g fill="#3a0a0d">
        <rect x="1" y="5" width="1" height="3" />
        <rect x="2" y="4" width="1" height="1" />
        <rect x="2" y="8" width="1" height="1" />
        <rect x="3" y="3" width="1" height="1" />
        <rect x="3" y="9" width="1" height="1" />
        <rect x="4" y="2" width="1" height="1" />
        <rect x="4" y="10" width="1" height="1" />
        <rect x="5" y="2" width="6" height="1" />
        <rect x="11" y="2" width="1" height="1" />
        <rect x="12" y="3" width="1" height="1" />
        <rect x="12" y="9" width="1" height="1" />
        <rect x="13" y="4" width="1" height="1" />
        <rect x="13" y="8" width="1" height="1" />
        <rect x="14" y="5" width="1" height="3" />
        <rect x="5" y="11" width="6" height="1" />
        <rect x="4" y="12" width="1" height="1" />
        <rect x="11" y="12" width="1" height="1" />
        <rect x="3" y="13" width="1" height="1" />
        <rect x="12" y="13" width="1" height="1" />
        <rect x="5" y="14" width="6" height="1" />
      </g>
      <!-- body -->
      <g fill="#ff4f40">
        <rect x="5" y="3" width="6" height="1" />
        <rect x="4" y="4" width="8" height="1" />
        <rect x="3" y="5" width="10" height="1" />
        <rect x="3" y="6" width="10" height="1" />
        <rect x="3" y="7" width="10" height="1" />
        <rect x="4" y="8" width="8" height="1" />
        <rect x="5" y="9" width="6" height="1" />
        <rect x="5" y="12" width="6" height="1" />
        <rect x="6" y="13" width="4" height="1" />
      </g>
      <!-- claws -->
      <g fill="#ff775f">
        <rect x="1" y="6" width="2" height="1" />
        <rect x="2" y="5" width="1" height="1" />
        <rect x="2" y="7" width="1" height="1" />
        <rect x="13" y="6" width="2" height="1" />
        <rect x="13" y="5" width="1" height="1" />
        <rect x="13" y="7" width="1" height="1" />
      </g>
      <!-- eyes -->
      <g fill="#081016">
        <rect x="6" y="5" width="1" height="1" />
        <rect x="9" y="5" width="1" height="1" />
      </g>
      <g fill="#f5fbff">
        <rect x="6" y="4" width="1" height="1" />
        <rect x="9" y="4" width="1" height="1" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.oclob {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  animation: oclobBob 3.4s ease-in-out infinite;
}
/* cyan ハロー＝本体には掛けず背後だけ（ドットの輪郭を保つ） */
.oclob::before {
  content: "";
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(34, 211, 238, .26), rgba(34, 211, 238, 0) 68%);
  filter: blur(2px);
  z-index: 0;
}
.oclob__art {
  position: relative;
  z-index: 1;
  width: 80%;
  height: auto;
  /* ドット絵を拡大してもにじませない */
  image-rendering: pixelated;
  shape-rendering: crispEdges;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, .45));
}
@keyframes oclobBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@media (prefers-reduced-motion: reduce) {
  .oclob { animation: none; }
}
</style>
