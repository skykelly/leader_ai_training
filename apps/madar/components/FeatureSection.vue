<template>
  <section ref="rootEl" class="feat" :class="{ reverse: index % 2 === 1 }">
    <div class="container feat-grid">
      <div class="copy">
        <p class="eyebrow">{{ feature.eyebrow }}</p>
        <h2 ref="titleEl" class="display title">{{ feature.title }}</h2>
        <p ref="bodyEl" class="body">{{ feature.body }}</p>
      </div>
      <div class="spacer" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Feature } from '~/data/sections'

const props = defineProps<{ feature: Feature; index: number; nodeIndex: number }>()

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)
const journey = useJourney()
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })
    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 62%',
      onEnter: () => {
        tween.play()
        gsap.from(bodyEl.value, { autoAlpha: 0, y: 24, duration: 0.8, ease: 'power3.out' })
        journey.setActiveNode(props.nodeIndex)
      },
      onEnterBack: () => journey.setActiveNode(props.nodeIndex),
    })
    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.feat {
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.feat-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2rem;
}

.reverse .feat-grid {
  direction: rtl;
}

.reverse .copy {
  direction: ltr;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  max-width: 30rem;
}

.title {
  font-size: var(--text-xl);
  white-space: pre-line;
}

.body {
  color: var(--ink-muted);
}

@media (max-width: 768px) {
  .feat-grid {
    grid-template-columns: 1fr;
  }

  .spacer {
    display: none;
  }
}
</style>
