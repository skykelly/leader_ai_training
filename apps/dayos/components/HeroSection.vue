<template>
  <section id="orbit-track" class="hero-track">
    <div class="hero-stage">
      <p class="eyebrow reveal">Multi-cloud AI for business</p>
      <h1 ref="titleEl" class="display title">One core.<br />Every system.</h1>
      <p class="lede reveal">160개가 넘는 업무 툴을 하나의 AI 코어로 정렬합니다.</p>
      <MagneticButton class="reveal">Book a demo →</MagneticButton>
      <p class="eyebrow scroll-hint reveal" aria-hidden="true">Scroll ↓</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const titleEl = ref<HTMLElement | null>(null)
let tween: gsap.core.Tween

onMounted(() => {
  const result = splitRevealTween(titleEl.value!, { delay: 0.1 })
  tween = result.tween
  gsap.from('.hero-stage .reveal', {
    autoAlpha: 0,
    y: 22,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.4,
  })
})

onBeforeUnmount(() => tween?.kill())
</script>

<style scoped>
.hero-track {
  /* 히어로 아래로 스크롤 러너웨이를 둬 오빗 링이 순서대로 정렬되고
     카메라가 코어로 다가갈 시간을 준다 */
  height: 240vh;
}

.hero-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.7rem;
  text-align: center;
  padding: 0 1.5rem;
}

.title {
  font-size: var(--text-hero);
  max-width: 16ch;
}

.lede {
  color: var(--ink-muted);
  max-width: 32rem;
}

.scroll-hint {
  position: absolute;
  bottom: 2.2rem;
  left: 50%;
  translate: -50% 0;
  animation: hint 2.2s ease-in-out infinite;
}

@keyframes hint {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(8px); opacity: 1; }
}
</style>
