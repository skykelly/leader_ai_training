<template>
  <section ref="rootEl" class="timeline">
    <div class="container">
      <p class="eyebrow">Onshore expertise &amp; legacy</p>
      <h2 ref="titleEl" class="display title">Three decades<br />on the ground</h2>

      <div class="rail">
        <div ref="lineEl" class="line" />
        <div v-for="m in milestones" :key="m.year" ref="itemEls" class="item">
          <span class="dot" />
          <p class="year display">{{ m.year }}</p>
          <p class="item-title display">{{ m.title }}</p>
          <p class="item-body">{{ m.body }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { milestones } from '~/data/sections'

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const lineEl = ref<HTMLElement | null>(null)
const itemEls = ref<HTMLElement[]>([])
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })
    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 65%',
      onEnter: () => tween.play(),
    })

    // 타임라인 세로선이 스크롤 진행도에 맞춰 위에서 아래로 그려진다
    gsap.fromTo(
      lineEl.value,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: lineEl.value,
          start: 'top 60%',
          end: 'bottom 80%',
          scrub: 0.4,
        },
      },
    )

    itemEls.value.forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 78%',
        onEnter: () => gsap.to(el, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: (i % 2) * 0.05 }),
      })
    })

    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.timeline {
  padding: 8rem 0;
}

.title {
  font-size: var(--text-xl);
  margin: 1rem 0 4rem;
}

.rail {
  position: relative;
  max-width: 42rem;
  margin-left: 1rem;
  padding-left: 2.5rem;
}

.line {
  position: absolute;
  top: 0.4rem;
  left: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(var(--teal), var(--sky));
  transform-origin: top;
  transform: scaleY(0);
}

.item {
  position: relative;
  padding-bottom: 3.5rem;
  opacity: 0;
  transform: translateX(-16px);
}

.item:last-child {
  padding-bottom: 0;
}

.dot {
  position: absolute;
  left: -2.5rem;
  top: 0.35rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--amber);
  box-shadow: 0 0 0 4px var(--bg);
}

.year {
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  color: var(--teal);
  margin-bottom: 0.4rem;
}

.item-title {
  font-size: var(--text-lg);
  margin-bottom: 0.5rem;
}

.item-body {
  color: var(--ink-muted);
  max-width: 34rem;
}
</style>
