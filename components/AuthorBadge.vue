<script setup lang="ts">
// public/ のアセットは base パスを考慮して参照する（GitHub Pages のサブパス対応）
const avatar = import.meta.env.BASE_URL + 'author-avatar.jpg'
</script>

<template>
  <div class="author">
    <img class="author__avatar" :src="avatar" alt="himiyosh" />
    <span class="author__meta">
      <small>AUTHOR</small>
      <b>himiyosh</b>
    </span>
  </div>
</template>
