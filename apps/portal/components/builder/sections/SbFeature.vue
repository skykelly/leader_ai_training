<template>
  <section ref="rootEl" class="sb-feature sb-container" :class="{ reverse: section.reverse }">
    <div class="copy">
      <p class="sb-eyebrow">{{ section.eyebrow }}</p>
      <h2 class="sb-display title">{{ section.title }}</h2>
      <p class="body">{{ section.body }}</p>
    </div>
    <div class="panel" />
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { FeatureSection } from '~/types/site'

defineProps<{ section: FeatureSection }>()

const rootEl = ref<HTMLElement | null>(null)
const scroller = inject<Ref<HTMLElement | null>>('sb-scroller', ref(null))
let ctx: gsap.Context | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: rootEl.value,
      scroller: scroller.value ?? undefined,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.from(rootEl.value!.querySelectorAll('.copy > *'), { autoAlpha: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.08 })
        gsap.from(rootEl.value!.querySelector('.panel'), { autoAlpha: 0, y: 40, duration: 1.1, ease: 'power3.out' })
      },
    })
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.sb-feature {
  min-height: 76vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 3rem;
  padding-block: 3.5rem;
}

.sb-feature.reverse .copy {
  order: 2;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: 28rem;
}

.title {
  font-size: clamp(1.7rem, 3.4vw, 2.8rem);
}

.body {
  color: var(--sb-ink-muted);
}

.panel {
  aspect-ratio: 4 / 3;
  border: 1px solid var(--sb-line);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--sb-accent) 7%, transparent);
}

@media (max-width: 720px) {
  .sb-feature {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .sb-feature.reverse .copy {
    order: 0;
  }
}
</style>
