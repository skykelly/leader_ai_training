<template>
  <main>
    <StarterBackground kind="flow" :colors="['#7df0c9', '#5b8cff', '#d8fff0']" />

    <section class="hero container">
      <p class="eyebrow reveal-fade">scrollkit starter template</p>
      <h1 ref="titleEl" class="display hero-title split-mask">스크롤이
이야기가 되는 곳</h1>
      <p class="lede reveal-fade">
        이 페이지의 배경·리빌·커서·버튼은 전부 packages/scrollkit에서 왔습니다.
        토큰 색과 텍스트만 바꿔서 나만의 사이트를 시작해 보세요.
      </p>
      <p class="scroll-hint reveal-fade">Scroll ↓</p>
    </section>

    <section v-for="(f, i) in features" :key="f.title" ref="featureEls" class="feature container" :class="{ reverse: i % 2 === 1 }">
      <div class="copy">
        <p class="eyebrow">{{ f.eyebrow }}</p>
        <h2 class="display feature-title">{{ f.title }}</h2>
        <p class="body">{{ f.body }}</p>
      </div>
      <div class="panel" />
    </section>

    <section ref="ctaEl" class="cta container">
      <h2 ref="ctaTitleEl" class="display cta-title split-mask">지금 시작하세요</h2>
      <div class="cta-actions">
        <ScrollMagneticButton to="/backgrounds">배경 3종 데모 보기</ScrollMagneticButton>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const features = [
  {
    eyebrow: 'Reveal',
    title: '텍스트가 행 마스크 안에서 떠오릅니다',
    body: 'splitRevealTween 하나로 히어로·소제목이 같은 시그니처 리빌을 공유합니다. 섹션이 화면에 들어오는 순간 ScrollTrigger가 재생합니다.',
  },
  {
    eyebrow: 'Background',
    title: '배경은 스크롤 속도에 반응합니다',
    body: '빠르게 스크롤할수록 흐름장의 점들이 가속하고, 멈추면 서서히 가라앉습니다. 터치 기기에서는 시선이 자동으로 순회합니다.',
  },
]

const titleEl = ref<HTMLElement | null>(null)
const featureEls = ref<HTMLElement[]>([])
const ctaEl = ref<HTMLElement | null>(null)
const ctaTitleEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    const { split } = splitRevealTween(titleEl.value!, { delay: 0.15 })
    gsap.from('.reveal-fade', { autoAlpha: 0, y: 22, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.4 })

    featureEls.value.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 70%',
        onEnter: () => {
          gsap.from(el.querySelectorAll('.copy > *'), { autoAlpha: 0, y: 26, duration: 0.9, ease: 'power3.out', stagger: 0.08 })
          gsap.from(el.querySelector('.panel'), { autoAlpha: 0, y: 44, duration: 1.1, ease: 'power3.out' })
        },
        once: true,
      })
    })

    const { split: ctaSplit, tween } = splitRevealTween(ctaTitleEl.value!, { paused: true })
    ScrollTrigger.create({ trigger: ctaEl.value, start: 'top 65%', onEnter: () => tween.play() })

    return () => {
      split.revert()
      ctaSplit.revert()
    }
  })
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
main {
  position: relative;
  z-index: 1;
}

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.6rem;
}

.hero-title {
  font-size: var(--text-hero);
  white-space: pre-line;
}

.lede {
  color: var(--ink-muted);
  max-width: 36rem;
}

.scroll-hint {
  margin-top: 3rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.3em;
  color: var(--ink-faint);
}

.feature {
  min-height: 80vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 3rem;
  padding-block: 4rem;
}

.feature.reverse .copy {
  order: 2;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  max-width: 30rem;
}

.feature-title {
  font-size: var(--text-xl);
}

.body {
  color: var(--ink-muted);
}

.panel {
  aspect-ratio: 4 / 3;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.cta {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.6rem;
  text-align: center;
}

.cta-title {
  font-size: var(--text-xl);
}

@media (max-width: 768px) {
  .feature {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .feature.reverse .copy {
    order: 0;
  }
}
</style>
