<template>
  <section class="hero">
    <p ref="eyebrowEl" class="eyebrow reveal">An autonomous AI software engineer</p>
    <h1 ref="titleEl" class="display hero-title">Ship code<br />while you sleep</h1>
    <p ref="ledeEl" class="lede reveal">
      요구사항을 이해하고, 계획을 세우고, 코드를 짜고, 테스트하고, PR을 엽니다.
      사람은 방향을 검토하기만 하면 됩니다.
    </p>
    <MagneticButton class="reveal">Watch it work →</MagneticButton>
    <p class="eyebrow scroll-hint reveal" aria-hidden="true">Scroll ↓</p>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const titleEl = ref<HTMLElement | null>(null)

onMounted(() => {
  const { tween } = splitRevealTween(titleEl.value!, { delay: 0.1 })
  gsap.from('.hero .reveal', {
    autoAlpha: 0,
    y: 22,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.4,
  })
  onBeforeUnmount(() => tween.kill())
})
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
  text-align: center;
  padding: 0 1.5rem;
}

.hero-title {
  font-size: var(--text-hero);
  max-width: 14ch;
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
