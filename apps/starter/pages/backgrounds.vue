<template>
  <main>
    <StarterBackground :kind="kind" :colors="palettes[kind]" />

    <div class="switcher container">
      <NuxtLink class="back eyebrow" to="/">← Starter</NuxtLink>
      <div class="pills">
        <button
          v-for="k in kinds"
          :key="k"
          class="pill"
          :class="{ on: kind === k }"
          type="button"
          @click="kind = k"
        >
          {{ k }}
        </button>
      </div>
    </div>

    <section class="tall container">
      <p class="eyebrow">Backgrounds demo</p>
      <h1 class="display title">scrollkit 배경 3종</h1>
      <p class="lede">
        flow(흐름장 dot 필드)·warp(워프 스트릭)·orbit(오빗 링)을 전환해 보세요.
        flow/warp는 스크롤 속도에 가속하고, orbit은 스크롤 진행도에 따라 링이 순서대로 나타납니다.
      </p>
    </section>
    <section class="tall container">
      <p class="body">계속 스크롤하면 배경이 반응합니다…</p>
    </section>
    <section class="tall container">
      <p class="body">orbit 배경은 여기쯤에서 세 번째 링까지 정렬됩니다.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { BackgroundKind } from '~/components/StarterBackground.vue'

const kinds: BackgroundKind[] = ['flow', 'warp', 'orbit']
const kind = ref<BackgroundKind>('flow')

const palettes: Record<BackgroundKind, string[]> = {
  flow: ['#7df0c9', '#5b8cff', '#d8fff0'],
  warp: ['#00f0ff', '#ff3df0', '#ffe14d'],
  orbit: ['#c8ff4d'],
}
</script>

<style scoped>
main {
  position: relative;
  z-index: 1;
}

.switcher {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1.2rem;
}

.pills {
  display: flex;
  gap: 0.5rem;
}

.pill {
  font: inherit;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.35rem 1rem;
  cursor: pointer;
  transition:
    color 0.25s ease,
    border-color 0.25s ease;
}

.pill:hover {
  color: var(--ink);
}

.pill.on {
  color: var(--bg);
  background: var(--accent);
  border-color: var(--accent);
}

.tall {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.4rem;
}

.title {
  font-size: var(--text-hero);
}

.lede,
.body {
  color: var(--ink-muted);
  max-width: 36rem;
}
</style>
