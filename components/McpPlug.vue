<script setup lang="ts">
// MCP actor + protocol-boundary + flow diagram for the MCP slide (dev p11).
//
// Replaces the earlier "USB-C hub" illustration (which drew tools + a plug but
// omitted the two actors that matter). This bespoke, on-brand SVG makes the real
// relationship legible at a glance:
//
//   MCP Host（AIアプリ）  ─ inside it: LLM ＋ MCP Client
//        │  ① 要求（この道具を使いたい）
//        ▼        ── crosses the MCP 標準（protocol boundary）──
//   MCP Server ─ ③ ツールを実行／データを取得 → Tools / Resources
//        ▲  ④ 結果（実行された答え）
//
// Design intent:
// - Host / Client / Server are all explicitly labelled (audit C-1 fix).
// - The dashed vertical line is the standardized boundary; request/result cross it.
// - "実行" lives on the Server side (badge + body copy + connector to tools),
//   so beginners see the LLM does NOT run the tool itself.
// - Single 1-client : 1-server example; multi-server nuance is left to the note.
// - USB-C stays only as an auxiliary "挿せばつながる" sublabel, not the star.
//
// Bespoke SVG (no image deps, crisp on Pages, animatable). Base appearance is set
// with presentation attributes so it survives the Reader's fragment sanitizer
// (which strips scoped CSS); the scoped <style> only adds the flowing pulse and is
// gated by prefers-reduced-motion.
defineProps<{}>()
</script>

<template>
  <div
    class="plug"
    role="img"
    aria-label="MCP Host内のLLMがMCP Clientへ要求し、MCP標準を介してMCP Serverがツールやデータを利用し、結果をClientへ返す流れ"
  >
    <svg viewBox="0 0 740 250" class="plug__svg" font-family="Noto Sans JP, sans-serif" aria-hidden="true">
      <defs>
        <radialGradient id="mcpGlowA" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#22d3ee" stop-opacity=".16" />
          <stop offset="1" stop-color="#22d3ee" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="mcpGlowB" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#a855f7" stop-opacity=".16" />
          <stop offset="1" stop-color="#a855f7" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- ambient brand glows: cyan (host) → purple (server) diagonal -->
      <circle cx="130" cy="130" r="150" fill="url(#mcpGlowA)" />
      <circle cx="610" cy="130" r="150" fill="url(#mcpGlowB)" />

      <!-- ══ HOST（cyan） ══ -->
      <text x="132" y="30" text-anchor="middle" fill="#67e8f9" font-size="14px" font-weight="800" letter-spacing=".01em">MCP Host（AIアプリ）</text>
      <rect x="8" y="42" width="248" height="182" rx="16" fill="#0d1524" stroke="#22d3ee" stroke-opacity=".5" stroke-width="1.6" />

      <!-- LLM node -->
      <rect x="26" y="62" width="212" height="52" rx="11" fill="rgba(255,255,255,.03)" stroke="#ffffff" stroke-opacity=".1" stroke-width="1.4" />
      <g transform="translate(40,74) scale(1.05)" fill="none" stroke="#67e8f9" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 6.2C12 4.9 10.9 4 9.4 4 8 4 6.8 5 6.7 6.4 5.5 6.7 4.6 7.7 4.6 9c0 .8.4 1.5 1 2-.5.4-.9 1-.9 1.8 0 1.1.8 2 1.9 2.2.2 1.2 1.3 2.1 2.6 2.1 1.2 0 2.2-.9 2.2-2.1z" />
        <path d="M12 6.2C12 4.9 13.1 4 14.6 4 16 4 17.2 5 17.3 6.4c1.2.3 2.1 1.3 2.1 2.6 0 .8-.4 1.5-1 2 .5.4.9 1 .9 1.8 0 1.1-.8 2-1.9 2.2-.2 1.2-1.3 2.1-2.6 2.1-1.2 0-2.2-.9-2.2-2.1z" />
      </g>
      <text x="80" y="83" fill="#eef1fb" font-size="15px" font-weight="800">LLM</text>
      <text x="80" y="101" fill="#8b93a7" font-size="11px">考える（頭脳・自分では実行しない）</text>

      <!-- Client node -->
      <rect x="26" y="124" width="212" height="76" rx="12" fill="rgba(34,211,238,.08)" stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.5" />
      <g transform="translate(42,146) scale(1.1)" fill="none" stroke="#67e8f9" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 3v4M15 3v4" />
        <path d="M7 7h10v2.5a5 5 0 0 1-10 0z" />
        <path d="M12 14.5V18a3 3 0 0 0 3 3h1.5" />
      </g>
      <text x="82" y="152" fill="#eef1fb" font-size="15px" font-weight="800">MCP Client</text>
      <text x="82" y="171" fill="#9fb0cc" font-size="11px">サーバごとに1つ作る</text>
      <text x="82" y="187" fill="#8b93a7" font-size="10.5px">つなぎ役（要求を送る）</text>

      <!-- ══ BOUNDARY（MCP 標準） ══ -->
      <line x1="289" y1="40" x2="289" y2="226" stroke="#fcd34d" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="4 5" />
      <text x="289" y="66" text-anchor="middle" fill="#fcd34d" font-size="13px" font-weight="800">MCP 標準</text>
      <text x="289" y="82" text-anchor="middle" fill="#8b93a7" font-size="10px">プロトコル</text>
      <!-- small plug motif on the boundary (USB-C sublabel) -->
      <g transform="translate(283,96)" fill="none" stroke="#fcd34d" stroke-opacity=".8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="0" y="2" width="12" height="7" rx="3.5" />
        <path d="M6 9v3" />
      </g>
      <text x="289" y="126" text-anchor="middle" fill="#a8b1c4" font-size="10px">挿せばつながる</text>

      <!-- ① request lane: Client → Server (cyan) -->
      <line x1="238" y1="152" x2="318" y2="152" stroke="#155e6b" stroke-width="6" stroke-linecap="round" />
      <line class="mcp__flow mcp__flow--req" x1="238" y1="152" x2="318" y2="152" stroke="#22d3ee" stroke-width="3" stroke-linecap="round" pathLength="100" />
      <path d="M322 152l-11-5v10z" fill="#22d3ee" />
      <text x="292" y="145" text-anchor="middle" fill="#67e8f9" font-size="11.5px" font-weight="800">① 要求</text>

      <!-- ④ result lane: Server → Client (green) -->
      <line x1="318" y1="188" x2="238" y2="188" stroke="#14532d" stroke-width="6" stroke-linecap="round" />
      <line class="mcp__flow mcp__flow--res" x1="318" y1="188" x2="238" y2="188" stroke="#22c55e" stroke-width="3" stroke-linecap="round" pathLength="100" />
      <path d="M234 188l11-5v10z" fill="#22c55e" />
      <text x="292" y="207" text-anchor="middle" fill="#86efac" font-size="11.5px" font-weight="800">④ 結果</text>

      <!-- ══ SERVER（purple） ══ -->
      <text x="438" y="30" text-anchor="middle" fill="#d8b4fe" font-size="14px" font-weight="800">MCP Server</text>
      <rect x="322" y="42" width="232" height="182" rx="16" fill="#160e24" stroke="#a855f7" stroke-opacity=".5" stroke-width="1.6" />
      <!-- Server accepts the request here; execution remains on this side. -->
      <rect x="338" y="58" width="92" height="28" rx="8" fill="rgba(34,197,94,.12)" stroke="#22c55e" stroke-opacity=".6" stroke-width="1.3" />
      <g transform="translate(348,66) scale(.75)" fill="none" stroke="#86efac" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.4 9.9 L 21.4 14.1 L 19.4 13.6 L 18.4 16.1 L 20.1 17.2 L 17.2 20.1 L 16.1 18.4 L 13.6 19.4 L 14.1 21.4 L 9.9 21.4 L 10.4 19.4 L 7.9 18.4 L 6.8 20.1 L 3.9 17.2 L 5.6 16.1 L 4.6 13.6 L 2.6 14.1 L 2.6 9.9 L 4.6 10.4 L 5.6 7.9 L 3.9 6.8 L 6.8 3.9 L 7.9 5.6 L 10.4 4.6 L 9.9 2.6 L 14.1 2.6 L 13.6 4.6 L 16.1 5.6 L 17.2 3.9 L 20.1 6.8 L 18.4 7.9 L 19.4 10.4 Z" />
        <circle cx="12" cy="12" r="2.8" />
      </g>
      <text x="378" y="77" fill="#86efac" font-size="12.5px" font-weight="800">② 受理</text>
      <text x="438" y="135" text-anchor="middle" fill="#eef1fb" font-size="12.5px" font-weight="700">③ 受け取った要求どおりに</text>
      <text x="438" y="154" text-anchor="middle" fill="#eef1fb" font-size="12.5px" font-weight="700">サーバ側がツールを動かす</text>
      <text x="438" y="176" text-anchor="middle" fill="#8b93a7" font-size="10.5px">＝ 実行の責任は Server にある</text>

      <!-- ③ server → tools/resources connectors (purple) -->
      <path d="M554 108H572" stroke="#a855f7" stroke-width="2.4" stroke-linecap="round" />
      <path d="M576 108l-9-4v8z" fill="#a855f7" />
      <path d="M554 170H572" stroke="#a855f7" stroke-width="2.4" stroke-linecap="round" />
      <path d="M576 170l-9-4v8z" fill="#a855f7" />
      <text x="561" y="141" text-anchor="middle" fill="#c4a3f0" font-size="10px" font-weight="700">利用</text>

      <!-- Tools -->
      <rect x="580" y="82" width="152" height="54" rx="12" fill="rgba(168,85,247,.08)" stroke="#a855f7" stroke-opacity=".4" stroke-width="1.4" />
      <g transform="translate(598,98) scale(1.05)" fill="none" stroke="#d8b4fe" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15.3 8.7a3.6 3.6 0 0 1-4.5 4.5l-5 5a1.8 1.8 0 0 1-2.5-2.5l5-5a3.6 3.6 0 0 1 4.5-4.5L10.4 8.1a1 1 0 0 0 1.4 1.4z" />
      </g>
      <text x="634" y="105" fill="#eef1fb" font-size="14px" font-weight="800">Tools</text>
      <text x="634" y="123" fill="#8b93a7" font-size="10.5px">道具（動かす）</text>

      <!-- Resources -->
      <rect x="580" y="144" width="152" height="54" rx="12" fill="rgba(168,85,247,.08)" stroke="#a855f7" stroke-opacity=".4" stroke-width="1.4" />
      <g transform="translate(598,160) scale(1.05)" fill="none" stroke="#d8b4fe" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="12" cy="5.5" rx="6.5" ry="2.5" />
        <path d="M5.5 5.5v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-6" />
        <path d="M5.5 11.5v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-6" />
      </g>
      <text x="634" y="167" fill="#eef1fb" font-size="13.5px" font-weight="800">Resources</text>
      <text x="634" y="185" fill="#8b93a7" font-size="10.5px">データ（読む）</text>
    </svg>
  </div>
</template>

<style scoped>
.plug { position: relative; width: 100%; height: 100%; pointer-events: none; }
.plug__svg { width: 100%; height: 100%; overflow: visible; display: block; }

.mcp__flow {
  stroke-dasharray: 18 82;
  stroke-dashoffset: 100;
  animation: mcpFlow 2.4s linear infinite;
}
.mcp__flow--res { animation-delay: 1.2s; }

@keyframes mcpFlow { to { stroke-dashoffset: 0; } }

@media (prefers-reduced-motion: reduce) {
  .mcp__flow { animation: none; stroke-dasharray: none; stroke-dashoffset: 0; }
}
</style>
