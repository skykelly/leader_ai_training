<template>
  <div v-if="reduced" class="journey-fallback" aria-hidden="true" />
  <canvas v-else ref="canvasEl" class="journey-canvas" aria-hidden="true" />
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = ref(false)
const journey = useJourney()
let scrollTrigger: ScrollTrigger | undefined

onMounted(async () => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value || !canvasEl.value) return
  await journey.init(canvasEl.value)

  // 문서 전체 스크롤 진행도(0..1)가 곧 경로 위 카메라 위치가 된다
  scrollTrigger = ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => journey.setProgress(self.progress),
  })
})

onBeforeUnmount(() => {
  scrollTrigger?.kill()
  journey.destroy()
})
</script>

<style scoped>
.journey-canvas,
.journey-fallback {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  background: var(--bg);
}

.journey-fallback {
  background:
    linear-gradient(135deg, rgba(255, 99, 64, 0.18), transparent 60%),
    var(--bg);
}
</style>
