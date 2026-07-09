<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
}>()
</script>

<template>
  <div class="brand" :class="`brand--${size || 'md'}`">
    <span class="brand__mark" />
    <span class="brand__text">
      <b>JoJo</b>
      <small v-if="subtitle">{{ subtitle }}</small>
    </span>
  </div>
</template>

<style scoped>
.brand { display: inline-flex; align-items: center; gap: .55rem; }
.brand__mark {
  display: block;
  background: linear-gradient(135deg, #22d3ee, #a855f7);
  transform: rotate(45deg);
  border-radius: 5px;
  box-shadow: 0 0 16px -2px color-mix(in srgb, #22d3ee 60%, transparent);
}
.brand__text { display: flex; flex-direction: column; line-height: 1; }
.brand__text b { font-weight: 900; letter-spacing: .01em; color: #f3f5fb; }
.brand__text small { color: #8b93a7; font-weight: 700; margin-top: .22em; letter-spacing: .04em; }

.brand--sm .brand__mark { width: 18px; height: 18px; }
.brand--sm .brand__text b { font-size: 1.05rem; }
.brand--sm .brand__text small { font-size: .6rem; }

.brand--md .brand__mark { width: 26px; height: 26px; }
.brand--md .brand__text b { font-size: 1.5rem; }
.brand--md .brand__text small { font-size: .72rem; }

.brand--lg .brand__mark { width: 34px; height: 34px; }
.brand--lg .brand__text b { font-size: 2rem; }
.brand--lg .brand__text small { font-size: .85rem; }
</style>
