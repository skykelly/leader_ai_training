<template>
  <div v-if="visible" ref="rootEl" class="loader">
    <p class="wordmark display">
      <span v-for="(ch, i) in 'wrk'" :key="i" class="ch">{{ ch }}</span><span class="ch star">*</span>
    </p>
    <!-- 래퍼 하단에 붙은 웨이브 — 래퍼가 위로 슬라이드하면 물결 가장자리가 화면을 쓸고 지나간다 -->
    <svg class="loader-wave" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
      <path d="M 0 0 C 30 12, 70 12, 100 0 L 100 0 L 0 0 Z" fill="var(--navy-deep)" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const emit = defineEmits<{ done: [] }>()
const visible = ref(true)
const rootEl = ref<HTMLElement | null>(null)

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    visible.value = false
    emit('done')
    return
  }
  gsap
    .timeline({
      onComplete: () => {
        visible.value = false
        emit('done')
      },
    })
    .from('.loader .ch', { yPercent: 120, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.09 })
    .to('.loader .star', { rotate: 180, duration: 0.5, ease: 'power2.inOut' }, '<0.5')
    .to(rootEl.value, { yPercent: -112, duration: 0.9, ease: 'power4.inOut' }, '+=0.45')
})
</script>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy-deep);
}

.wordmark {
  font-size: clamp(3rem, 8vw, 6rem);
  color: var(--cream);
  display: flex;
}

.ch {
  display: inline-block;
}

.star {
  color: var(--teal);
}

/* 래퍼 아래에 이어 붙은 물결 — 래퍼가 -112%로 올라갈 때 화면을 지나간다 */
.loader-wave {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 12vh;
}
</style>
