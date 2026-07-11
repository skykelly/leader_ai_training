<template>
  <NuxtLink :to="`/library/${lib.slug}`" class="card" :style="{ '--card-accent': lib.accent }">
    <figure class="thumb-wrap">
      <img :src="thumbSrc" :alt="`${lib.title} 클론 스크린샷`" class="thumb" loading="lazy" />
      <span class="num display">{{ String(index + 1).padStart(2, '0') }}</span>
    </figure>
    <div class="meta">
      <p class="eyebrow">{{ lib.original.name }}</p>
      <h2 class="display name">{{ lib.title }}</h2>
      <p class="tagline">{{ lib.tagline }}</p>
      <div class="chips">
        <span v-for="s in lib.stack.slice(0, 3)" :key="s" class="chip">{{ s }}</span>
      </div>
    </div>
    <span class="arrow display" aria-hidden="true">→</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Library } from '~/data/libraries'

const props = defineProps<{ lib: Library; index: number }>()

const base = useRuntimeConfig().app.baseURL
const thumbSrc = computed(() => base + props.lib.thumb)
</script>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--line);
}

.thumb-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 0.9rem;
  aspect-ratio: 16 / 10;
  background: var(--panel);
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s var(--ease-out);
}

.card:hover .thumb {
  transform: scale(1.045);
}

.num {
  position: absolute;
  top: 0.9rem;
  left: 1rem;
  font-size: 0.95rem;
  color: #fff;
  opacity: 0.85;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.name {
  font-size: var(--text-xl);
  transition: color 0.3s var(--ease-out);
}

.card:hover .name {
  color: var(--card-accent);
}

.tagline {
  color: var(--ink-muted);
  font-size: var(--text-sm);
  letter-spacing: 0.02em;
}

.chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.3rem;
}

.arrow {
  position: absolute;
  right: 0.2rem;
  bottom: 2rem;
  font-size: 1.6rem;
  color: var(--ink-faint);
  transition:
    transform 0.4s var(--ease-out),
    color 0.4s var(--ease-out);
}

.card:hover .arrow {
  transform: translateX(6px);
  color: var(--card-accent);
}
</style>
