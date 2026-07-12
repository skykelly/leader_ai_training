<template>
  <section ref="rootEl" class="story">
    <div class="stage">
      <p class="eyebrow">From insight to shared knowledge</p>
      <h2 ref="titleEl" class="display title">One idea,<br />seen by everyone.</h2>
      <p ref="bodyEl" class="body">
        한 사람의 통찰이 검색 가능한 지식이 되고, 팀 전체가 같은 답에 도달합니다.
        LUMEN은 그 과정을 자동으로 연결합니다.
      </p>
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
      start: 'top 60%',
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
  min-height: 150vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
}

.stage {
  text-align: center;
  max-width: 34rem;
}

.title {
  font-size: var(--text-xl);
  margin: 1rem 0 1.3rem;
}

.body {
  color: var(--ink-muted);
}
</style>
