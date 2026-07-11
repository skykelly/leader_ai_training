<template>
  <component
    :is="to ? NuxtLink : 'button'"
    ref="rootEl"
    :to="to"
    class="magnetic display"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <span class="label"><slot /></span>
  </component>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { NuxtLink } from '#components'

defineProps<{ to?: string }>()

const rootEl = ref<{ $el?: HTMLElement } | HTMLElement | null>(null)

function el(): HTMLElement | null {
  const r = rootEl.value
  return r ? (r instanceof HTMLElement ? r : (r.$el ?? null)) : null
}

// 마그네틱 효과: 버튼이 커서를 향해 끌려오고, 떠나면 탄성으로 복귀
function onMove(e: PointerEvent) {
  const node = el()
  if (!node) return
  const rect = node.getBoundingClientRect()
  const x = e.clientX - rect.left - rect.width / 2
  const y = e.clientY - rect.top - rect.height / 2
  gsap.to(node, { x: x * 0.35, y: y * 0.35, duration: 0.4, ease: 'power3.out' })
  gsap.to(node.querySelector('.label'), { x: x * 0.12, y: y * 0.12, duration: 0.4, ease: 'power3.out' })
}

function onLeave() {
  const node = el()
  if (!node) return
  gsap.to([node, node.querySelector('.label')], { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
}
</script>

<style scoped>
.magnetic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1.4rem 3rem;
  border: 1px solid var(--ink);
  border-radius: 999px;
  font-size: var(--text-md);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transition: background-color 0.35s var(--ease-out), color 0.35s var(--ease-out);
  will-change: transform;
}

.magnetic:hover {
  background: var(--ink);
  color: var(--bg);
}

.label {
  display: inline-block;
  will-change: transform;
}
</style>
