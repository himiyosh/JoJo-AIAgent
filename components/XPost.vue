<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  handle: string
  accent?: 'a' | 'b'
  role?: string
  date?: string
}>(), { accent: 'a', role: '', date: '' })

const initials = computed(() =>
  props.name.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase())

const color = computed(() => (props.accent === 'b' ? '#a855f7' : '#22d3ee'))
const avGrad = computed(() =>
  props.accent === 'b'
    ? 'linear-gradient(140deg,#6b21a8,#a855f7)'
    : 'linear-gradient(140deg,#0e7490,#22d3ee)')
</script>

<template>
  <article class="xp" :class="{ 'xp--deco': !!$slots.deco }" :style="{ '--xc': color, '--av': avGrad }">
    <header class="xp__hd">
      <span class="xp__av" aria-hidden="true">{{ initials }}</span>
      <span class="xp__id">
        <span class="xp__nm">
          {{ name }}
          <svg class="xp__vf" viewBox="0 0 22 22" aria-label="認証済み">
            <path fill-rule="evenodd" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.689.878.634.131 1.291.082 1.899-.14.273.587.704 1.086 1.246 1.44.541.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.442c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.706 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
          </svg>
        </span>
        <a class="xp__hn" :href="`https://x.com/${handle}`" target="_blank" rel="noopener">@{{ handle }}</a>
      </span>
      <svg class="xp__logo" viewBox="0 0 24 24" aria-label="X">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    </header>

    <p class="xp__bd"><slot name="post" /></p>
    <p v-if="$slots.jp" class="xp__jp"><span class="xp__tr">翻訳</span><slot name="jp" /></p>

    <footer class="xp__ft">
      <span class="xp__when"><span v-if="role" class="xp__role">{{ role }}</span><span v-if="role && date" class="xp__sep">·</span>{{ date }}</span>
      <span class="xp__acts" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z" /></svg>
        <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" /></svg>
        <svg viewBox="0 0 24 24"><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" /></svg>
        <svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" /></svg>
      </span>
    </footer>

    <div v-if="$slots.deco" class="xp__deco"><slot name="deco" /></div>
  </article>
</template>

<style scoped>
.xp {
  --xp-gutter: 9rem;
  position: relative;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 1rem;
  padding: .52rem 1.1rem .4rem;
  background:
    radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--xc) 9%, transparent), transparent 42%),
    color-mix(in srgb, var(--xc) 3%, rgba(255, 255, 255, .015));
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), border-color .35s, box-shadow .35s;
}
.xp:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--xc) 38%, var(--line));
  box-shadow: 0 14px 36px -18px color-mix(in srgb, var(--xc) 70%, transparent);
}
.xp__hd { display: flex; align-items: center; gap: .6rem; }
.xp__av {
  width: 42px; height: 42px; border-radius: 50%; flex: none;
  display: grid; place-items: center;
  font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: .9rem; color: #fff; letter-spacing: .03em;
  background: var(--av);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .2), 0 2px 12px -3px var(--xc);
}
.xp__id { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
.xp__nm { display: inline-flex; align-items: center; gap: .25rem; font-weight: 700; color: var(--ink); font-size: .98rem; }
.xp__vf { width: 1.05em; height: 1.05em; flex: none; }
.xp__vf path { fill: var(--xc); }
.xp__hn { color: var(--muted); font-size: .82rem; text-decoration: none; border: none; width: max-content; }
.xp__hn:hover { color: var(--xc); }
.xp__logo { width: 1.18rem; height: 1.18rem; margin-left: auto; flex: none; opacity: .82; }
.xp__logo path { fill: var(--ink); }

.xp__bd { margin: .4rem 0 0; font-size: 1rem; line-height: 1.42; color: var(--ink); font-weight: 500; text-wrap: pretty; }
.xp__bd :deep(em) { font-style: normal; font-weight: 800; color: var(--xc); }

.xp__jp { margin: .26rem 0 0; font-size: .78rem; line-height: 1.46; color: var(--ink-soft); }
.xp__tr {
  display: inline-block; margin-right: .45rem; padding: .02rem .4rem; border-radius: .35rem;
  font-family: 'JetBrains Mono', monospace; font-size: .62rem; letter-spacing: .04em; vertical-align: .06em;
  color: var(--muted); border: 1px solid var(--line); background: rgba(255, 255, 255, .02);
}

.xp__ft {
  margin-top: .32rem; padding-top: .32rem; border-top: 1px solid var(--line);
  display: flex; align-items: center; justify-content: space-between; gap: .6rem;
}
.xp__when { font-family: 'JetBrains Mono', monospace; font-size: .68rem; color: var(--muted); letter-spacing: .02em; display: inline-flex; align-items: center; gap: .35rem; min-width: 0; }
.xp__role { color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.xp__sep { opacity: .6; }
.xp__acts { display: inline-flex; align-items: center; gap: 1.15rem; flex: none; }
.xp__acts svg { width: 1.02rem; height: 1.02rem; }
.xp__acts svg path { fill: var(--muted); transition: fill .25s; }
.xp:hover .xp__acts svg:nth-child(3) path { fill: color-mix(in srgb, var(--xc) 70%, var(--muted)); }

@media (prefers-reduced-motion: reduce) {
  .xp, .xp__acts svg path { transition: none; }
  .xp:hover { transform: none; }
}

/* optional playful mascot tucked into the card's right gutter (e.g. Lobster on
   Steinberger's "OpenClaw" post) — reserve a right gutter so text never collides */
.xp--deco { padding-right: var(--xp-gutter); }
.xp__deco {
  position: absolute; right: .55rem; top: 50%; transform: translateY(-50%);
  width: 8rem; display: flex; flex-direction: column; align-items: center; gap: .2rem;
  pointer-events: none;
}
.xp__deco :deep(.oclob) { width: 100%; }
.xp__deco :deep(.xp__pun) {
  font-family: 'JetBrains Mono', monospace; font-size: .64rem; letter-spacing: .02em;
  color: var(--muted); white-space: nowrap;
}
.xp__deco :deep(.xp__pun b) { color: #fb7185; font-weight: 700; }
</style>
