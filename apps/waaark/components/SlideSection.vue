<template>
  <section
    ref="rootEl"
    class="slide"
    :style="{ background: slide.bg, color: slide.ink, '--illu-ink': slide.ink }"
  >
    <div class="slide-grid">
      <div class="copy">
        <p class="eyebrow reveal-fade">{{ slide.eyebrow }}</p>
        <h2 ref="titleEl" class="display title">{{ slide.title }}</h2>
        <p class="body reveal-fade">{{ slide.body }}</p>
      </div>
      <div class="visual reveal-fade">
        <SlideIllustration :variant="slide.illustration" :accent="slide.accent" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import type { Slide } from '~/data/slides'

const props = defineProps<{ slide: Slide; active: boolean; animate: boolean }>()

const rootEl = ref<HTMLElement | null>(null)
let split: SplitText | null = null
let floatTween: gsap.core.Tween | null = null
const titleEl = ref<HTMLElement | null>(null)

/** 슬라이드가 활성화될 때마다 콘텐츠 리빌을 처음부터 재생 */
function reveal() {
  const root = rootEl.value!
  split?.revert()
  split = new SplitText(titleEl.value!, { type: 'lines,chars', linesClass: 'line', mask: 'lines' })

  const tl = gsap.timeline()
  tl.fromTo(
    split.chars,
    { yPercent: 115 },
    { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.02 },
    0.1,
  )
    .fromTo(
      root.querySelectorAll('.reveal-fade'),
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 },
      0.25,
    )
    // 일러스트 드로우온: stroke-dashoffset 1→0
    .fromTo(
      root.querySelectorAll('.draw'),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.08 },
      0.35,
    )

  // 둥실거리는 플로팅 루프
  floatTween?.kill()
  const floats = root.querySelectorAll('.float')
  if (floats.length) {
    floatTween = gsap.to(floats, { y: -7, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  }
}

watch(
  () => props.active,
  (on) => {
    if (on && props.animate) nextTick(reveal)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  floatTween?.kill()
  split?.revert()
})
</script>

<style scoped>
.slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  transition: none;
}

/* reduced-motion 폴백: 문서 흐름에 쌓이는 일반 섹션 */
:global(body.static-scroll) .slide {
  position: relative;
  min-height: 100vh;
}

.slide-grid {
  width: min(100% - 4rem, 72rem);
  margin-inline: auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: 3rem;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.title {
  font-size: var(--text-hero);
  white-space: pre-line;
}

.body {
  max-width: 30rem;
  opacity: 0.85;
}

.visual {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .slide-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .copy {
    align-items: center;
    order: 2;
  }

  .visual {
    order: 1;
  }

  .visual :deep(.illu) {
    width: min(50vw, 220px);
  }
}
</style>
