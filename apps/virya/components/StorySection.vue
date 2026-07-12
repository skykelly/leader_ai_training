<template>
  <section ref="rootEl" class="story">
    <div class="container story-grid">
      <div class="copy">
        <p class="eyebrow">How a site comes online</p>
        <h2 ref="titleEl" class="display title">From foundation<br />to first spin</h2>
        <p ref="bodyEl" class="body">
          바람 자원 조사부터 기초 공사, 터빈 설치, 계통 연계까지 — 한 부지가 전력망에 연결되기까지의
          과정을 하나의 흐름으로 관리합니다. 첫 블레이드가 돌아가는 순간까지 평균 18개월이 걸립니다.
        </p>
      </div>
      <TurbineIllustration />
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)
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
      },
    })
    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.story {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 4rem 0;
}

.story-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 3rem;
  align-items: center;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  max-width: 30rem;
}

.title {
  font-size: var(--text-xl);
}

.body {
  color: var(--ink-muted);
}

@media (max-width: 768px) {
  .story-grid {
    grid-template-columns: 1fr;
  }
}
</style>
