<template>
  <section ref="rootEl" class="stats">
    <div class="container">
      <p class="eyebrow">By the numbers</p>
      <h2 ref="titleEl" class="display title">Trusted along<br />the whole route</h2>
      <div class="grid">
        <div v-for="(stat, i) in statList" :key="stat.label" ref="cardEls" class="card glass">
          <p class="value display">
            <span ref="numEls" :data-target="stat.value">0</span>{{ stat.suffix }}
          </p>
          <p class="label">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stats } from '~/data/sections'

const statList = stats
const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const cardEls = ref<HTMLElement[]>([])
const numEls = ref<HTMLElement[]>([])
const journey = useJourney()
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })
    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 60%',
      onEnter: () => {
        tween.play()
        journey.setActiveNode(4)
        gsap.from(cardEls.value, {
          autoAlpha: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
        })
        numEls.value.forEach((el) => {
          const target = Number(el.dataset.target)
          const decimals = target % 1 !== 0 ? 1 : 0
          const proxy = { v: 0 }
          gsap.to(proxy, {
            v: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = proxy.v.toFixed(decimals)
            },
          })
        })
      },
      onEnterBack: () => journey.setActiveNode(4),
    })
    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.stats {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 6rem 0;
}

.title {
  font-size: var(--text-xl);
  margin: 1rem 0 3rem;
  max-width: 20ch;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.25rem;
}

.card {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.value {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  color: var(--core);
}

.label {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
