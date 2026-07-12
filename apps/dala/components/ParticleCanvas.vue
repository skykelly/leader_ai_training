<template>
  <div v-if="reduced" class="particle-fallback" aria-hidden="true" />
  <canvas v-else ref="canvasEl" class="particle-canvas" aria-hidden="true" />
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = ref(false)
const particles = useParticles()
let scrollTrigger: ScrollTrigger | undefined

onMounted(async () => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value || !canvasEl.value) return
  await particles.init(canvasEl.value)

  // #morph-track 구간(히어로+스토리)을 스크롤하는 동안 0(카오스)→1(전구)→2(구체)로 진행한다
  scrollTrigger = ScrollTrigger.create({
    trigger: '#morph-track',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => particles.setMorph(self.progress * 2),
  })
})

onBeforeUnmount(() => {
  scrollTrigger?.kill()
  particles.destroy()
})
</script>

<style scoped>
.particle-canvas,
.particle-fallback {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  background: var(--bg);
}

.particle-fallback {
  background:
    radial-gradient(38% 32% at 50% 42%, rgba(245, 185, 66, 0.22), transparent 70%),
    var(--bg);
}
</style>
