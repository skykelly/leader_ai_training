<template>
  <!-- reduced-motion 환경에서는 WebGL 대신 정적 그라디언트 폴백 -->
  <div v-if="reduced" class="aura-fallback" aria-hidden="true" />
  <canvas v-else ref="canvasEl" class="aura-canvas" aria-hidden="true" />
</template>

<script setup lang="ts">
const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = ref(false)
const aura = useAura()

onMounted(async () => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value || !canvasEl.value) return
  await aura.init(canvasEl.value)
  aura.setIntensity(1, 2)
})

onBeforeUnmount(() => aura.destroy())
</script>

<style scoped>
.aura-canvas,
.aura-fallback {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}

.aura-fallback {
  background:
    radial-gradient(60% 50% at 50% 45%, rgba(139, 92, 246, 0.35), transparent 70%),
    radial-gradient(40% 40% at 60% 55%, rgba(34, 211, 238, 0.2), transparent 70%),
    var(--bg);
}
</style>
