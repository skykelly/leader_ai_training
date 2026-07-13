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
          <!-- 4개 패럴랙스 레이어: 하늘(태양·광선·구름) / 뒷언덕 / 앞언덕 / 터빈 -->
          <g ref="skyEl">
            <rect width="1600" height="900" fill="url(#sky)" />
            <g ref="raysEl" opacity="0.35" stroke="#f2a93b" stroke-width="6" stroke-linecap="round">
              <line x1="1180" y1="60" x2="1180" y2="20" />
              <line x1="1180" y1="380" x2="1180" y2="420" />
              <line x1="1020" y1="220" x2="980" y2="220" />
              <line x1="1340" y1="220" x2="1380" y2="220" />
              <line x1="1067" y1="107" x2="1039" y2="79" />
              <line x1="1293" y1="333" x2="1321" y2="361" />
              <line x1="1293" y1="107" x2="1321" y2="79" />
              <line x1="1067" y1="333" x2="1039" y2="361" />
            </g>
            <circle cx="1180" cy="220" r="120" fill="#f2a93b" opacity="0.85" />
            <ellipse ref="cloudA" cx="380" cy="180" rx="120" ry="30" fill="#ffffff" opacity="0.55" />
            <ellipse ref="cloudB" cx="760" cy="120" rx="90" ry="24" fill="#ffffff" opacity="0.4" />
          </g>
          <g ref="backHillEl">
            <path d="M0 560 Q 300 460 650 540 T 1600 500 V900 H0 Z" fill="#9fd2c1" />
          </g>
          <g ref="frontHillEl">
            <path d="M0 660 Q 400 580 900 650 T 1600 620 V900 H0 Z" fill="#1f7a5c" opacity="0.9" />
          </g>
          <g ref="turbinesEl" stroke="#10241d" stroke-width="4" stroke-linecap="round" opacity="0.55">
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
const skyEl = ref<SVGGElement | null>(null)
const backHillEl = ref<SVGGElement | null>(null)
const frontHillEl = ref<SVGGElement | null>(null)
const turbinesEl = ref<SVGGElement | null>(null)
const raysEl = ref<SVGGElement | null>(null)
const cloudA = ref<SVGEllipseElement | null>(null)
const cloudB = ref<SVGEllipseElement | null>(null)
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
    // 풍경 레이어들은 서로 다른 깊이(y 오프셋)에서 제자리로 내려앉아 원근을 만든다.
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
      .fromTo(skyEl.value, { y: -14 }, { y: 0, ease: 'none' }, 0)
      .fromTo(backHillEl.value, { y: 26 }, { y: 0, ease: 'none' }, 0)
      .fromTo(frontHillEl.value, { y: 48 }, { y: 0, ease: 'none' }, 0)
      .fromTo(turbinesEl.value, { y: 68 }, { y: 0, ease: 'none' }, 0)
      .fromTo(copyEl.value, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, ease: 'none' }, 0.5)

    // 앰비언트 루프 — 구름 드리프트와 태양 광선 회전 (스크럽과 무관하게 항상 재생)
    gsap.to(cloudA.value, { x: 70, duration: 26, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    gsap.to(cloudB.value, { x: -50, duration: 20, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    gsap.to(raysEl.value, { rotation: 360, duration: 60, repeat: -1, ease: 'none', svgOrigin: '1180 220' })
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
