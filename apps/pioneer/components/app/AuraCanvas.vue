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
  const scene = await aura.init(canvasEl.value)
  aura.setIntensity(1, 2)
  // 터치 기기: 커서가 없으니 시선이 자동으로 천천히 순회한다
  if (window.matchMedia('(pointer: coarse)').matches) scene.setAutoWander(true)
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
