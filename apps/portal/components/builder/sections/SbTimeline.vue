<template>
  <section ref="rootEl" class="sb-timeline sb-container">
    <h2 class="sb-display title">{{ section.title }}</h2>
    <div class="rail">
      <div ref="lineEl" class="line" />
      <div v-for="item in section.items" :key="item.year + item.text" ref="itemEls" class="item">
        <span class="dot" />
        <p class="year sb-display">{{ item.year }}</p>
        <p class="text">{{ item.text }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { TimelineSection } from '~/types/site'

defineProps<{ section: TimelineSection }>()

const rootEl = ref<HTMLElement | null>(null)
const lineEl = ref<HTMLElement | null>(null)
const itemEls = ref<HTMLElement[]>([])
const scroller = inject<Ref<HTMLElement | null>>('sb-scroller', ref(null))
let ctx: gsap.Context | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (lineEl.value) lineEl.value.style.transform = 'scaleY(1)'
    itemEls.value.forEach((el) => {
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
    return
  }
  ctx = gsap.context(() => {
    // virya TimelineSection 패턴 — 세로선이 스크롤 진행도에 맞춰 그려진다
    gsap.fromTo(
      lineEl.value,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: lineEl.value,
          scroller: scroller.value ?? undefined,
          start: 'top 62%',
          end: 'bottom 82%',
          scrub: 0.4,
        },
      },
    )
    itemEls.value.forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        scroller: scroller.value ?? undefined,
        start: 'top 80%',
        once: true,
        onEnter: () => gsap.to(el, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: (i % 2) * 0.05 }),
      })
    })
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.sb-timeline {
  padding-block: 5rem;
}

.title {
  font-size: clamp(1.7rem, 3.4vw, 2.8rem);
  margin-bottom: 3rem;
}

.rail {
  position: relative;
  max-width: 38rem;
  margin-left: 0.6rem;
  padding-left: 2.2rem;
}

.line {
  position: absolute;
  top: 0.4rem;
  left: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(var(--sb-accent), var(--sb-accent2));
  transform-origin: top;
  transform: scaleY(0);
}

.item {
  position: relative;
  padding-bottom: 2.8rem;
  opacity: 0;
  transform: translateX(-16px);
}

.item:last-child {
  padding-bottom: 0;
}

.dot {
  position: absolute;
  left: -2.2rem;
  top: 0.35rem;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--sb-accent);
  box-shadow: 0 0 0 4px var(--sb-bg);
}

.year {
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  color: var(--sb-accent);
  margin-bottom: 0.35rem;
}

.text {
  color: var(--sb-ink-muted);
}
</style>
