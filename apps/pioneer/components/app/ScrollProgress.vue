<template>
  <div class="progress" aria-hidden="true">
    <div ref="barEl" class="bar" />
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const barEl = ref<HTMLElement | null>(null)
const aura = useAura()
let trigger: ScrollTrigger | null = null

onMounted(() => {
  trigger = ScrollTrigger.create({
    start: 0,
    end: () => document.documentElement.scrollHeight - window.innerHeight,
    onUpdate: (self) => {
      gsap.set(barEl.value, { scaleY: self.progress })
      aura.setScroll(self.progress)
      // 스크롤 속도가 흐름장 가속 페달이 된다 (px/s → 0..1.5 정규화)
      aura.setFlowBoost(Math.abs(self.getVelocity()) / 2500)
    },
  })
})

onBeforeUnmount(() => trigger?.kill())
</script>

<style scoped>
.progress {
  position: fixed;
  right: 1.2rem;
  top: 50%;
  translate: 0 -50%;
  width: 2px;
  height: 30vh;
  background: var(--line);
  z-index: 50;
}

.bar {
  width: 100%;
  height: 100%;
  background: var(--ink);
  transform-origin: top;
  scale: 1 0;
}
</style>
