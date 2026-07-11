<template>
  <div v-if="enabled" ref="ringEl" class="cursor-ring" aria-hidden="true" />
</template>

<script setup lang="ts">
import gsap from 'gsap'

const enabled = ref(false)
const ringEl = ref<HTMLElement | null>(null)
let onMove: ((e: PointerEvent) => void) | null = null
let onOver: ((e: Event) => void) | null = null

onMounted(() => {
  enabled.value = window.matchMedia('(pointer: fine)').matches
  if (!enabled.value) return
  nextTick(() => {
    const x = gsap.quickTo(ringEl.value, 'x', { duration: 0.4, ease: 'power3.out' })
    const y = gsap.quickTo(ringEl.value, 'y', { duration: 0.4, ease: 'power3.out' })
    onMove = (e) => {
      x(e.clientX)
      y(e.clientY)
    }
    onOver = (e) => {
      const hot = (e.target as HTMLElement).closest('a, button, [role="button"]')
      gsap.to(ringEl.value, { scale: hot ? 1.8 : 1, duration: 0.3, ease: 'power2.out' })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerover', onOver)
  })
})

onBeforeUnmount(() => {
  if (onMove) window.removeEventListener('pointermove', onMove)
  if (onOver) window.removeEventListener('pointerover', onOver)
})
</script>

<style scoped>
.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  width: 30px;
  height: 30px;
  border: 1.5px solid #fff;
  border-radius: 50%;
  translate: -50% -50%;
  pointer-events: none;
  mix-blend-mode: difference;
}
</style>
