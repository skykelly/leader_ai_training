<template>
  <svg class="wave-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <path ref="pathEl" :d="initialD" fill="var(--navy-deep)" />
  </svg>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const pathEl = ref<SVGPathElement | null>(null)

const state: WaveState = { top: 100, bottom: 100, crestTop: 0, crestBottom: 0 }
const initialD = wavePath(state)

function render() {
  pathEl.value?.setAttribute('d', wavePath(state))
}

/**
 * 웨이브 스윕: 아래에서 차올라 화면을 덮고(이때 swap 콜백으로 슬라이드 교체),
 * 위로 빠져나가며 새 슬라이드를 공개한다.
 * crest는 이동 중에만 부풀어 액체처럼 보이게 한다.
 */
function sweep(swap: () => void): Promise<void> {
  return new Promise((resolve) => {
    state.top = 100
    state.bottom = 100
    gsap
      .timeline({ onUpdate: render, onComplete: () => resolve() })
      // 1단계: 웨이브가 차오르며 화면 덮기
      .to(state, { top: 0, duration: 0.65, ease: 'power2.in' }, 0)
      .to(state, { keyframes: [{ crestTop: -14, duration: 0.3 }, { crestTop: 0, duration: 0.35 }] }, 0)
      .add(swap)
      // 2단계: 웨이브가 위로 빠져나가며 새 슬라이드 공개
      .to(state, { bottom: 0, duration: 0.65, ease: 'power2.out' }, '>')
      .to(state, { keyframes: [{ crestBottom: -14, duration: 0.3 }, { crestBottom: 0, duration: 0.35 }] }, '<')
      .set(state, { top: 100, bottom: 100, crestTop: 0, crestBottom: 0 })
  })
}

defineExpose({ sweep })
</script>

<style scoped>
.wave-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 60;
  pointer-events: none;
}
</style>
