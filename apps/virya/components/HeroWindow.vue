<template>
  <section ref="pinEl" class="hero-window">
    <div class="stage">
      <div ref="sceneEl" class="scene">
        <svg class="scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#dff0ea" />
              <stop offset="100%" stop-color="#bfe0d6" />
            </linearGradient>
          </defs>
          <rect width="1600" height="900" fill="url(#sky)" />
          <circle cx="1180" cy="220" r="120" fill="#f2a93b" opacity="0.85" />
          <path d="M0 560 Q 300 460 650 540 T 1600 500 V900 H0 Z" fill="#9fd2c1" />
          <path d="M0 660 Q 400 580 900 650 T 1600 620 V900 H0 Z" fill="#1f7a5c" opacity="0.9" />
          <g stroke="#10241d" stroke-width="4" stroke-linecap="round" opacity="0.55">
            <g transform="translate(340 560)">
              <line x1="0" y1="0" x2="0" y2="-140" />
              <line x1="0" y1="-140" x2="34" y2="-118" />
              <line x1="0" y1="-140" x2="-22" y2="-98" />
              <line x1="0" y1="-140" x2="-4" y2="-172" />
            </g>
            <g transform="translate(560 600) scale(0.75)">
              <line x1="0" y1="0" x2="0" y2="-140" />
              <line x1="0" y1="-140" x2="34" y2="-118" />
              <line x1="0" y1="-140" x2="-22" y2="-98" />
              <line x1="0" y1="-140" x2="-4" y2="-172" />
            </g>
            <g transform="translate(1180 630) scale(0.55)">
              <line x1="0" y1="0" x2="0" y2="-140" />
              <line x1="0" y1="-140" x2="34" y2="-118" />
              <line x1="0" y1="-140" x2="-22" y2="-98" />
              <line x1="0" y1="-140" x2="-4" y2="-172" />
            </g>
          </g>
        </svg>
      </div>

      <div ref="copyEl" class="copy">
        <p class="eyebrow">Onshore wind, three decades in</p>
        <h1 class="display title">Built where<br />the wind lives.</h1>
        <p class="lede">우리는 바람이 부는 곳마다 가장 먼저 도착합니다. 온쇼어 풍력의 처음부터 지금까지.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const pinEl = ref<HTMLElement | null>(null)
const sceneEl = ref<HTMLElement | null>(null)
const copyEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ctx = gsap.context(() => {
    if (reduced) {
      gsap.set(sceneEl.value, { clipPath: 'circle(85% at 50% 50%)' })
      gsap.set(copyEl.value, { autoAlpha: 1, y: 0 })
      return
    }

    // 작은 원(창문)에서 화면 전체로 열리는 클립패스 아이리스 리빌 — 스크롤 진행도에
    // 그대로 스크럽된다. 화면을 완전히 채우기 전까지는 배경 페이지 색이 원 밖으로 보인다.
    gsap.timeline({
      scrollTrigger: {
        trigger: pinEl.value,
        start: 'top top',
        end: '+=140%',
        scrub: 0.6,
        pin: true,
      },
    })
      .fromTo(sceneEl.value, { clipPath: 'circle(9% at 50% 50%)' }, { clipPath: 'circle(85% at 50% 50%)', ease: 'none' }, 0)
      .fromTo(copyEl.value, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, ease: 'none' }, 0.5)
  }, pinEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.hero-window {
  position: relative;
}

.stage {
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.scene {
  position: absolute;
  inset: 0;
  clip-path: circle(9% at 50% 50%);
}

.scene-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.copy {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 1.5rem;
  opacity: 0;
}

.title {
  font-size: var(--text-hero);
  max-width: 16ch;
  margin: 0 auto 1.4rem;
}

.lede {
  color: var(--ink-muted);
  max-width: 34rem;
  margin: 0 auto;
}
</style>
