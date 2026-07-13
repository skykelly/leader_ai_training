<template>
  <div v-if="reduced" class="core-fallback" aria-hidden="true" />
  <canvas v-else ref="canvasEl" class="core-canvas" aria-hidden="true" />
</template>

<script setup lang="ts">
const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = ref(false)
const core = useCore()

onMounted(async () => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value || !canvasEl.value) return
  const scene = await core.init(canvasEl.value)
  // 터치 기기: 커서가 없으니 시선이 자동으로 천천히 순회한다
  if (window.matchMedia('(pointer: coarse)').matches) scene.setAutoWander(true)
})

onBeforeUnmount(() => core.destroy())
</script>

<style scoped>
.core-canvas,
.core-fallback {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  background: var(--bg);
}

.core-fallback {
  background:
    radial-gradient(38% 32% at 50% 46%, rgba(109, 240, 194, 0.28), transparent 70%),
    var(--bg);
}
</style>
