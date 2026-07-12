<template>
  <section ref="rootEl" class="stats">
    <div class="container">
      <p class="eyebrow">By the numbers</p>
      <h2 ref="titleEl" class="display title">Numbers that<br />hold up in the wind</h2>
      <div class="grid">
        <GaugeStat v-for="g in gauges" :key="g.label" :gauge="g" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gauges } from '~/data/sections'

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })
    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 65%',
      onEnter: () => tween.play(),
    })
    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.stats {
  min-height: 90vh;
  display: flex;
  align-items: center;
  padding: 5rem 0;
}

.title {
  font-size: var(--text-xl);
  margin: 1rem 0 3rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
