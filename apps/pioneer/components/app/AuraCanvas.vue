<template>
  <!-- reduced-motion 환경에서는 WebGL 대신 정적 dot 패턴 폴백 -->
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
  background: var(--bg);
}

.aura-fallback {
  background-color: var(--bg);
  background-image: radial-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1.6px);
  background-size: 28px 28px;
}
</style>
