<template>
  <div class="result">
    <p class="eyebrow reveal">Your aura says</p>
    <TypedText tag="h2" class="display name" :text="persona.name" :delay="220" caret />
    <TypedText class="tagline" :text="`${persona.nameKo} — ${persona.tagline}`" :delay="900" />
    <p class="desc reveal">{{ persona.description }}</p>

    <ul class="contents">
      <li v-for="(c, i) in persona.contents" :key="i" class="card reveal">
        <span class="eyebrow">{{ c.type }}</span>
        <span>{{ c.title }}</span>
      </li>
    </ul>

    <div class="actions reveal">
      <MagneticButton @click="$emit('restart')">Try again</MagneticButton>
      <NuxtLink to="/" class="home eyebrow">← Back to story</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import type { Persona } from '~/data/personas'

defineProps<{ persona: Persona }>()
defineEmits<{ restart: [] }>()

onMounted(() => {
  // 유형 공개 연출: 이름·태그라인은 TypedText가 찍고, 나머지는 순차 등장
  gsap.from('.reveal', {
    autoAlpha: 0,
    y: 30,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.5,
  })
})
</script>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  text-align: center;
  width: min(100%, 46rem);
}

.name {
  font-size: var(--text-xl);
}

.tagline {
  color: var(--ink);
}

.desc {
  color: var(--ink-muted);
  max-width: 36rem;
}

.contents {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  width: 100%;
  margin-top: 1rem;
}

.card {
  display: flex;
  align-items: baseline;
  gap: 1.2rem;
  text-align: left;
  padding: 1rem 1.4rem;
  border: 1px solid var(--line);
  border-radius: 0.8rem;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  margin-top: 1.6rem;
}

.home {
  color: var(--ink-muted);
}

.home:hover {
  color: var(--ink);
}
</style>
