<template>
  <div v-if="reduced" class="orbit-fallback" aria-hidden="true" />
  <canvas v-else ref="canvasEl" class="orbit-canvas" aria-hidden="true" />
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = ref(false)
const orbit = useOrbit()
let scrollTrigger: ScrollTrigger | undefined

onMounted(async () => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value || !canvasEl.value) return
  await orbit.init(canvasEl.value)

  // #orbit-track(히어로) 구간을 스크롤하는 동안 링이 순서대로 나타나며 카메라가 다가간다
  scrollTrigger = ScrollTrigger.create({
    trigger: '#orbit-track',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => orbit.setProgress(self.progress),
  })
})

onBeforeUnmount(() => {
  scrollTrigger?.kill()
  orbit.destroy()
})
</script>

<style scoped>
.orbit-canvas,
.orbit-fallback {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  background: var(--bg);
}

.orbit-fallback {
  background:
    radial-gradient(30% 26% at 50% 46%, rgba(200, 255, 77, 0.18), transparent 70%),
    var(--bg);
}
</style>
