<template>
  <div v-if="visible" ref="rootEl" class="preloader">
    <p class="eyebrow">Preparing the frontier</p>
    <p ref="counterEl" class="counter display">0</p>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const visible = ref(true)
const rootEl = ref<HTMLElement | null>(null)
const counterEl = ref<HTMLElement | null>(null)
const introDone = useState('introDone', () => false)

onMounted(() => {
  const state = { v: 0 }
  gsap
    .timeline({
      onComplete: () => {
        visible.value = false
        introDone.value = true
      },
    })
    // 퍼센트 카운터: 실제 로딩 대신 연출용 이징 카운트업
    .to(state, {
      v: 100,
      duration: 1.6,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (counterEl.value) counterEl.value.textContent = String(Math.round(state.v))
      },
    })
    // 마스크 리빌: 오버레이가 위로 걷히며 본문 공개
    .to(rootEl.value, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.9,
      ease: 'power4.inOut',
    })
})
</script>

<style scoped>
.preloader {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--bg-soft);
  clip-path: inset(0 0 0 0);
}

.counter {
  font-size: var(--text-hero);
}
</style>
