<template>
  <nav class="dot-nav" aria-label="슬라이드 내비게이션">
    <button
      v-for="(s, i) in slides"
      :key="s.id"
      class="dot"
      :class="{ active: i === index }"
      :aria-label="`${i + 1}번 슬라이드: ${s.id}`"
      :aria-current="i === index"
      @click="$emit('select', i)"
    />
  </nav>
</template>

<script setup lang="ts">
import type { Slide } from '~/data/slides'

defineProps<{ slides: Slide[]; index: number }>()
defineEmits<{ select: [i: number] }>()
</script>

<style scoped>
.dot-nav {
  position: fixed;
  right: 1.6rem;
  top: 50%;
  translate: 0 -50%;
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  mix-blend-mode: difference;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #fff;
  opacity: 0.45;
  transition:
    height 0.35s var(--ease-out),
    opacity 0.35s var(--ease-out);
}

.dot:hover {
  opacity: 0.8;
}

/* 활성 도트는 세로로 길어진다 — waaark의 pill 형태 인디케이터 */
.dot.active {
  height: 26px;
  opacity: 1;
}
</style>
