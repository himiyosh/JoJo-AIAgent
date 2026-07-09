<script setup lang="ts">
// Simplified, monochrome logo-style homage marks for source attribution.
// Self-made (not official assets); inherit currentColor so they tint to context.
const marks: Record<string, string> = {
  microsoft: "<rect x=\"3\" y=\"3\" width=\"7.6\" height=\"7.6\"/><rect x=\"13.4\" y=\"3\" width=\"7.6\" height=\"7.6\"/><rect x=\"3\" y=\"13.4\" width=\"7.6\" height=\"7.6\"/><rect x=\"13.4\" y=\"13.4\" width=\"7.6\" height=\"7.6\"/>",
  mcp: "<circle cx=\"12\" cy=\"12\" r=\"3\"/><circle cx=\"5\" cy=\"6.5\" r=\"2\"/><circle cx=\"19\" cy=\"6.5\" r=\"2\"/><circle cx=\"12\" cy=\"20\" r=\"2\"/><path d=\"M6.5 7.8 9.7 10.2M17.5 7.8 14.3 10.2M12 15v3\"/>",
  langchain: "<path d=\"M10.5 9h1.5a3 3 0 0 1 0 6H9a3 3 0 0 1-3-3 3 3 0 0 1 1.2-2.4\"/><path d=\"M13.5 15H12a3 3 0 0 1 0-6h3a3 3 0 0 1 3 3 3 3 0 0 1-1.2 2.4\"/>",
  openai: "<circle cx=\"15.60\" cy=\"12.00\" r=\"4\"/><circle cx=\"13.80\" cy=\"15.12\" r=\"4\"/><circle cx=\"10.20\" cy=\"15.12\" r=\"4\"/><circle cx=\"8.40\" cy=\"12.00\" r=\"4\"/><circle cx=\"10.20\" cy=\"8.88\" r=\"4\"/><circle cx=\"13.80\" cy=\"8.88\" r=\"4\"/>",
  anthropic: "<path fill-rule=\"evenodd\" d=\"M12 3.5 4 20.5h3.7l1.7-4h5.2l1.7 4H21z M10.5 9.6 12.6 14.6h-4.2z\"/>",
  github: "<path d=\"M12 3a9 9 0 0 0-2.8 17.5c.45.08.62-.2.62-.43v-1.5c-2.5.55-3-1.2-3-1.2-.4-1-1-1.3-1-1.3-.8-.55.06-.54.06-.54.9.06 1.4.93 1.4.93.8 1.4 2.1 1 2.6.76.08-.6.32-1 .57-1.24-2-.22-4.1-1-4.1-4.45 0-.98.35-1.78.93-2.4-.1-.23-.4-1.15.08-2.4 0 0 .76-.24 2.5.92a8.6 8.6 0 0 1 4.55 0c1.73-1.16 2.5-.92 2.5-.92.48 1.25.18 2.17.09 2.4.58.62.92 1.42.92 2.4 0 3.46-2.1 4.22-4.1 4.44.32.28.6.82.6 1.66v2.47c0 .24.16.52.62.43A9 9 0 0 0 12 3Z\"/>",
}
const filled = new Set(["microsoft","anthropic","github"])
const props = defineProps<{ name: string; size?: number | string }>()
const dim = (s?: number | string) => (s == null ? undefined : (typeof s === 'number' ? s + 'px' : s))
</script>

<template>
  <svg
    class="bmark"
    :class="`bmark--${name}`"
    :style="size ? { width: dim(size), height: dim(size) } : undefined"
    viewBox="0 0 24 24"
    :fill="filled.has(name) ? 'currentColor' : 'none'"
    :stroke="filled.has(name) ? 'none' : 'currentColor'"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    role="img"
    v-html="marks[name] || ''"
  />
</template>

<style scoped>
.bmark { width: 1em; height: 1em; display: inline-block; vertical-align: -0.14em; flex: none; }
</style>
