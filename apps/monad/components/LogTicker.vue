<template>
  <div class="ticker mono" aria-hidden="true">
    <div v-for="line in visible" :key="line.id" class="log-line" :class="line.kind">
      {{ line.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { logLines } from '~/data/sections'

interface Line {
  id: number
  text: string
  kind: 'noise' | 'signal'
}

const MAX_LINES = 6
const visible = ref<Line[]>([])
let cursor = 0
let nextId = 0
let interval: ReturnType<typeof setInterval> | undefined

function push() {
  const src = logLines[cursor % logLines.length]
  cursor++
  visible.value.push({ id: nextId++, ...src })
  if (visible.value.length > MAX_LINES) visible.value.shift()
  nextTick(() => {
    const els = document.querySelectorAll('.ticker .log-line')
    const last = els[els.length - 1]
    if (last) gsap.from(last, { y: 8, autoAlpha: 0, duration: 0.4, ease: 'power2.out' })
  })
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // 정적 3줄만 보여주고 순환하지 않는다
    visible.value = logLines.slice(0, 3).map((l) => ({ id: nextId++, ...l }))
    return
  }
  for (let i = 0; i < 3; i++) push()
  interval = setInterval(push, 1200)
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.ticker {
  position: absolute;
  left: 2rem;
  bottom: 2rem;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  pointer-events: none;
  max-width: 30rem;
}

.log-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-line.noise {
  color: color-mix(in srgb, var(--noise) 55%, var(--ink-faint));
}

.log-line.signal {
  color: color-mix(in srgb, var(--signal) 70%, var(--ink-faint));
}

@media (max-width: 900px) {
  .ticker {
    display: none;
  }
}
</style>
