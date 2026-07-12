<template>
  <section ref="pinEl" class="pipeline">
    <div class="stage-viewport">
      <p class="eyebrow">The pipeline</p>

      <svg class="pipe" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
        <path ref="trackPath" d="M20 30 H980" stroke="#2a323d" stroke-width="3" fill="none" />
        <path ref="fillPath" d="M20 30 H980" stroke="var(--signal)" stroke-width="3" fill="none" />
        <circle v-for="(s, i) in stages" :key="s.eyebrow" ref="nodeEls" :cx="nodeX(i)" cy="30" r="9" fill="#101620" stroke="#3a4552" stroke-width="2" />
      </svg>

      <div class="labels">
        <span v-for="(s, i) in stages" :key="s.eyebrow" ref="labelEls" class="mono label" :style="{ left: nodeX(i) / 10 + '%' }">
          {{ String(i + 1).padStart(2, '0') }} {{ s.eyebrow }}
        </span>
      </div>

      <div class="panel">
        <div v-for="(s, i) in stages" :key="s.eyebrow" ref="panelEls" class="panel-item" :class="{ active: i === 0 }">
          <h2 class="display panel-title">{{ s.title }}</h2>
          <p class="panel-body">{{ s.body }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stages } from '~/data/sections'

const pinEl = ref<HTMLElement | null>(null)
const trackPath = ref<SVGPathElement | null>(null)
const fillPath = ref<SVGPathElement | null>(null)
const nodeEls = ref<SVGCircleElement[]>([])
const panelEls = ref<HTMLElement[]>([])
let ctx: gsap.Context | undefined
let currentStage = 0

function nodeX(i: number) {
  const usable = 960
  return 20 + (usable / (stages.length - 1)) * i
}

function activateStage(index: number) {
  if (index === currentStage) return
  currentStage = index
  nodeEls.value.forEach((el, i) => {
    gsap.to(el, {
      attr: { r: i <= index ? 11 : 9, fill: i <= index ? 'var(--signal)' : '#101620' },
      stroke: i <= index ? 'var(--signal)' : '#3a4552',
      duration: 0.4,
      ease: 'power2.out',
    })
  })
  panelEls.value.forEach((el, i) => {
    gsap.to(el, { autoAlpha: i === index ? 1 : 0, y: i === index ? 0 : 12, duration: 0.4, ease: 'power2.out' })
  })
}

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ctx = gsap.context(() => {
    const length = fillPath.value!.getTotalLength()
    gsap.set(fillPath.value, { strokeDasharray: length, strokeDashoffset: length })
    gsap.set(panelEls.value, { autoAlpha: 0, y: 12 })
    gsap.set(panelEls.value[0], { autoAlpha: 1, y: 0 })

    if (reduced) {
      gsap.set(fillPath.value, { strokeDashoffset: 0 })
      activateStage(stages.length - 1)
      return
    }

    ScrollTrigger.create({
      trigger: pinEl.value,
      start: 'top top',
      end: '+=300%',
      scrub: 0.5,
      pin: true,
      onUpdate: (self) => {
        gsap.set(fillPath.value, { strokeDashoffset: length * (1 - self.progress) })
        const idx = Math.min(stages.length - 1, Math.floor(self.progress * stages.length))
        activateStage(idx)
      },
    })
  }, pinEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.pipeline {
  position: relative;
}

.stage-viewport {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2.5rem;
  padding: 0 1.5rem;
  max-width: 60rem;
  margin: 0 auto;
}

.pipe {
  width: 100%;
  height: 3.5rem;
  overflow: visible;
}

.labels {
  position: relative;
  height: 1.2rem;
  margin-top: -1.5rem;
}

.label {
  position: absolute;
  transform: translateX(-50%);
  font-size: var(--text-sm);
  color: var(--ink-faint);
  white-space: nowrap;
}

.panel {
  position: relative;
  min-height: 10rem;
}

.panel-item {
  position: absolute;
  inset: 0;
}

.panel-title {
  font-size: var(--text-xl);
  white-space: pre-line;
  margin-bottom: 1rem;
}

.panel-body {
  color: var(--ink-muted);
  max-width: 34rem;
}
</style>
