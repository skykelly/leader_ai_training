<template>
  <div v-if="reduced" class="warp-fallback" aria-hidden="true" />
  <canvas v-else ref="canvasEl" class="warp-canvas" aria-hidden="true" />
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = ref(false)
const warp = useWarp()
let scrollTrigger: ScrollTrigger | undefined

onMounted(async () => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value || !canvasEl.value) return
  await warp.init(canvasEl.value)

  // 스크롤 속도 자체가 가속 페달이 된다 — 빠르게 스크롤할수록 워프 속도가 올라간다
  scrollTrigger = ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const velocity = Math.abs(self.getVelocity()) / 900
      warp.setBoost(Math.min(1.6, velocity))
    },
  })
})

onBeforeUnmount(() => {
  scrollTrigger?.kill()
  warp.destroy()
})
</script>

<style scoped>
.warp-canvas,
.warp-fallback {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  background: var(--bg);
}

.warp-fallback {
  background:
    radial-gradient(40% 34% at 50% 44%, rgba(0, 240, 255, 0.18), transparent 70%),
    var(--bg);
}
</style>
