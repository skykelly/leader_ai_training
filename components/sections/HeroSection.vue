<template>
  <section ref="rootEl" class="hero">
    <div class="hero-inner">
      <p ref="eyebrowEl" class="eyebrow">An AI-era scrollytelling study</p>
      <h1 ref="titleEl" class="display hero-title">Prepare to Pioneer</h1>
      <p ref="ledeEl" class="lede">
        미지의 영역을 먼저 걷는 사람들을 위해.<br />
        스크롤을 내리며 개척자의 세계를 경험해 보세요.
      </p>
    </div>
    <p class="scroll-hint eyebrow" aria-hidden="true">Scroll ↓</p>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const rootEl = ref<HTMLElement | null>(null)
const eyebrowEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const ledeEl = ref<HTMLElement | null>(null)
const introDone = useState('introDone', () => false)

let ctx: gsap.Context | undefined

function playIntro() {
  ctx = gsap.context(() => {
    // 프리로더가 걷힌 직후 시그니처 리빌: 글자 단위로 마스크에서 올라온다
    const { tween } = splitRevealTween(titleEl.value!, { delay: 0.1 })
    gsap.from([eyebrowEl.value, ledeEl.value], {
      autoAlpha: 0,
      y: 24,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.15,
      delay: 0.45,
    })

    // 스크롤 시 히어로가 스케일 다운되며 뒤로 물러나는 스크럽
    gsap.to('.hero-inner', {
      scale: 0.92,
      autoAlpha: 0,
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: rootEl.value,
        start: 'top top',
        end: 'bottom 40%',
        scrub: true,
      },
    })

    return () => tween.kill()
  }, rootEl.value!)
}

onMounted(() => {
  if (introDone.value) playIntro()
  else {
    const stop = watch(introDone, (done) => {
      if (done) {
        playIntro()
        stop()
      }
    })
  }
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
  padding: 0 1.5rem;
}

.hero-title {
  font-size: var(--text-hero);
  max-width: 12ch;
}

.lede {
  color: var(--ink-muted);
  max-width: 34rem;
}

.scroll-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  translate: -50% 0;
  animation: hint 2.2s ease-in-out infinite;
}

@keyframes hint {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(8px);
    opacity: 1;
  }
}
</style>
