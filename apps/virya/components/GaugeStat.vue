<template>
  <div ref="rootEl" class="gauge">
    <svg class="ring" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="58" fill="none" stroke="var(--line)" stroke-width="10" />
      <circle
        ref="arcEl"
        cx="70"
        cy="70"
        r="58"
        fill="none"
        :stroke="gauge.color"
        stroke-width="10"
        stroke-linecap="round"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="76" text-anchor="middle" class="value display">
        <tspan ref="numEl" :data-target="gauge.value">0</tspan>{{ gauge.suffix }}
      </text>
    </svg>
    <p class="label">{{ gauge.label }}</p>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Gauge } from '~/data/sections'

const props = defineProps<{ gauge: Gauge }>()

const rootEl = ref<HTMLElement | null>(null)
const arcEl = ref<SVGCircleElement | null>(null)
const numEl = ref<SVGTSpanElement | null>(null)
let ctx: gsap.Context | undefined

const CIRCUMFERENCE = 2 * Math.PI * 58

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.set(arcEl.value, { strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE })

    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(arcEl.value, {
          strokeDashoffset: CIRCUMFERENCE * (1 - props.gauge.value / 100),
          duration: 1.4,
          ease: 'power2.out',
        })
        const proxy = { v: 0 }
        gsap.to(proxy, {
          v: props.gauge.value,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => {
            if (numEl.value) numEl.value.textContent = Math.round(proxy.v).toString()
          },
        })
      },
    })
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.ring {
  width: 100%;
  max-width: 12rem;
}

.value {
  font-size: 1.7rem;
  fill: var(--ink);
}

.label {
  color: var(--ink-muted);
  font-size: var(--text-sm);
  text-align: center;
  max-width: 14rem;
}
</style>
