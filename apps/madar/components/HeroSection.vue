<template>
  <section ref="rootEl" class="hero">
    <p ref="eyebrowEl" class="eyebrow reveal">Unified logistics, mapped end to end</p>
    <h1 ref="titleEl" class="display hero-title">One path.<br />Every shipment.</h1>
    <p ref="ledeEl" class="lede reveal">
      출발지에서 도착지까지, 화물의 전체 경로를 하나의 흐름으로 관리합니다.
    </p>
    <MagneticButton class="reveal">See the platform →</MagneticButton>
    <p class="eyebrow scroll-hint reveal" aria-hidden="true">Scroll ↓</p>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const journey = useJourney()
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { delay: 0.1 })
    gsap.from('.hero .reveal', {
      autoAlpha: 0,
      y: 22,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 0.4,
    })

    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 65%',
      onEnter: () => journey.setActiveNode(0),
      onEnterBack: () => journey.setActiveNode(0),
    })

    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
  text-align: center;
  padding: 0 1.5rem;
}

.hero-title {
  font-size: var(--text-hero);
  max-width: 14ch;
}

.lede {
  color: var(--ink-muted);
  max-width: 34rem;
}

.scroll-hint {
  position: absolute;
  bottom: 2.2rem;
  left: 50%;
  translate: -50% 0;
  animation: hint 2.2s ease-in-out infinite;
}

@keyframes hint {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(8px); opacity: 1; }
}
</style>
