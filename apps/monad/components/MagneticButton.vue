<template>
  <button ref="rootEl" class="magnetic display" @pointermove="onMove" @pointerleave="onLeave">
    <span class="label"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const rootEl = ref<HTMLElement | null>(null)

function onMove(e: PointerEvent) {
  const node = rootEl.value
  if (!node) return
  const rect = node.getBoundingClientRect()
  const x = e.clientX - rect.left - rect.width / 2
  const y = e.clientY - rect.top - rect.height / 2
  gsap.to(node, { x: x * 0.35, y: y * 0.35, duration: 0.4, ease: 'power3.out' })
  gsap.to(node.querySelector('.label'), { x: x * 0.12, y: y * 0.12, duration: 0.4, ease: 'power3.out' })
}

function onLeave() {
  const node = rootEl.value
  if (!node) return
  gsap.to([node, node.querySelector('.label')], { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
}
</script>

<style scoped>
.magnetic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 2.6rem;
  border: 1px solid var(--ink);
  border-radius: 999px;
  font-size: var(--text-md);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: background-color 0.35s var(--ease-out), color 0.35s var(--ease-out), border-color 0.35s var(--ease-out);
  will-change: transform;
}

.magnetic:hover {
  background: var(--signal);
  border-color: var(--signal);
  color: var(--bg);
}

.label {
  display: inline-block;
  will-change: transform;
}
</style>
