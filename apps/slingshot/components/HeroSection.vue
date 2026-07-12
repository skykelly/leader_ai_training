<template>
  <section class="hero">
    <p class="eyebrow reveal">Global footage transfer</p>
    <h1 ref="titleEl" class="display title">Move a day's dailies.<br />At the speed of light.</h1>
    <p class="lede reveal">
      할리우드, 파리, 방콕 — 어디로든 편집 가능한 화질 그대로, 몇 분 안에 도착합니다.
    </p>
    <MagneticButton class="reveal">Start a transfer →</MagneticButton>
    <p class="eyebrow scroll-hint reveal" aria-hidden="true">Scroll to accelerate ↓</p>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const titleEl = ref<HTMLElement | null>(null)
let tween: gsap.core.Tween

onMounted(() => {
  const result = splitRevealTween(titleEl.value!, { delay: 0.1 })
  tween = result.tween
  gsap.from('.hero .reveal', {
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
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.8rem;
  text-align: center;
  padding: 0 1.5rem;
}

.title {
  font-size: var(--text-hero);
  max-width: 18ch;
  text-transform: uppercase;
}

.lede {
  color: var(--ink-muted);
  max-width: 34rem;
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
