<template>
  <div v-if="enabled" ref="dotEl" class="cursor-dot" aria-hidden="true" />
  <div v-if="enabled" ref="ringEl" class="cursor-ring" aria-hidden="true" />
</template>

<script setup lang="ts">
import gsap from 'gsap'

const enabled = ref(false)
const dotEl = ref<HTMLElement | null>(null)
const ringEl = ref<HTMLElement | null>(null)

let onMove: ((e: PointerEvent) => void) | null = null
let onOver: ((e: Event) => void) | null = null

onMounted(() => {
  // 터치 기기에서는 비활성
  enabled.value = window.matchMedia('(pointer: fine)').matches
  if (!enabled.value) return

  nextTick(() => {
    // 점은 즉시, 링은 관성 있는 quickTo 트윈으로 따라온다
    const dotX = gsap.quickTo(dotEl.value, 'x', { duration: 0.1, ease: 'power2.out' })
    const dotY = gsap.quickTo(dotEl.value, 'y', { duration: 0.1, ease: 'power2.out' })
    const ringX = gsap.quickTo(ringEl.value, 'x', { duration: 0.45, ease: 'power3.out' })
    const ringY = gsap.quickTo(ringEl.value, 'y', { duration: 0.45, ease: 'power3.out' })

    onMove = (e) => {
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }
    // 인터랙티브 요소 위에서 링 확대
    onOver = (e) => {
      const hot = (e.target as HTMLElement).closest('a, button, [role="button"]')
      gsap.to(ringEl.value, { scale: hot ? 2 : 1, duration: 0.3, ease: 'power2.out' })
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
.cursor-dot,
.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  pointer-events: none;
  border-radius: 50%;
  translate: -50% -50%;
}

.cursor-dot {
  width: 6px;
  height: 6px;
  background: var(--ink);
}

.cursor-ring {
  width: 36px;
  height: 36px;
  border: 1px solid var(--ink-faint);
}
</style>
