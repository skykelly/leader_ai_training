<template>
  <div ref="rootEl" class="turbine-wrap" aria-hidden="true">
    <svg class="turbine" viewBox="0 0 400 420" preserveAspectRatio="xMidYMid meet">
      <g class="wind-lines" stroke="#4fa8d8" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.5">
        <path d="M20 120 Q 70 110 130 120" stroke-dasharray="8 10" />
        <path d="M10 170 Q 80 158 150 172" stroke-dasharray="8 10" />
        <path d="M30 220 Q 90 210 140 222" stroke-dasharray="8 10" />
      </g>

      <path
        ref="towerEl"
        class="tower"
        d="M200 400 L200 150"
        stroke="#10241d"
        stroke-width="10"
        stroke-linecap="round"
        fill="none"
      />
      <rect x="176" y="132" width="48" height="26" rx="8" fill="#10241d" />

      <g class="blades" style="transform-origin: 200px 145px">
        <g v-for="i in 3" :key="i" :transform="`rotate(${i * 120} 200 145)`">
          <path
            d="M200 145 C 214 100 214 40 200 8 C 186 40 186 100 200 145 Z"
            fill="#1f7a5c"
          />
        </g>
        <circle cx="200" cy="145" r="12" fill="#f2a93b" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const rootEl = ref<HTMLElement | null>(null)
const towerEl = ref<SVGPathElement | null>(null)
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const path = towerEl.value!
    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })

    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 75%',
      end: 'top 25%',
      scrub: 0.6,
      onUpdate: (self) => {
        gsap.set(path, { strokeDashoffset: length * (1 - self.progress) })
      },
    })
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.turbine-wrap {
  width: 100%;
  max-width: 22rem;
  margin-inline: auto;
}

.turbine {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.blades {
  animation: spin 5s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.wind-lines path {
  animation: flow 2.4s linear infinite;
}

.wind-lines path:nth-child(2) {
  animation-duration: 2.9s;
}

.wind-lines path:nth-child(3) {
  animation-duration: 2.1s;
}

@keyframes flow {
  to {
    stroke-dashoffset: -36;
  }
}

@media (prefers-reduced-motion: reduce) {
  .blades {
    animation: none;
  }
}
</style>
