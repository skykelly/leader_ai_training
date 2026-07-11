<template>
  <div class="app">
    <AuraCanvas />
    <AppPreloader />
    <AppCursor />
    <AppNav />
    <ScrollProgress />
    <div ref="wipeEl" class="page-wipe" aria-hidden="true" />
    <NuxtPage :transition="pageTransition" />
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { TransitionProps } from 'vue'

const lenis = useLenis()
const wipeEl = ref<HTMLElement | null>(null)

onMounted(() => lenis.init())
onBeforeUnmount(() => lenis.destroy())

// 페이지 전환: 오버레이가 아래에서 차오르며 이전 페이지를 덮고,
// 위로 걷히며 새 페이지를 공개하는 와이프
const pageTransition: TransitionProps = {
  css: false,
  mode: 'out-in',
  onLeave(el, done) {
    gsap
      .timeline({ onComplete: done })
      .set(wipeEl.value, { yPercent: 100 })
      .to(wipeEl.value, { yPercent: 0, duration: 0.55, ease: 'power4.inOut' })
      .to(el, { autoAlpha: 0, duration: 0.2 }, '<0.3')
  },
  onEnter(el, done) {
    window.scrollTo(0, 0)
    gsap
      .timeline({
        onComplete: () => {
          ScrollTrigger.refresh()
          done()
        },
      })
      .fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
      .to(wipeEl.value, { yPercent: -100, duration: 0.55, ease: 'power4.inOut' }, '<')
      .set(wipeEl.value, { yPercent: 100 })
  },
}
</script>

<style>
.app > main {
  position: relative;
  z-index: 1;
}

.page-wipe {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: var(--bg-soft);
  transform: translateY(100%);
  pointer-events: none;
}
</style>
