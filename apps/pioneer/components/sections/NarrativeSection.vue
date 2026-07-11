<template>
  <section ref="rootEl" class="narrative">
    <div class="narrative-sticky">
      <div class="container narrative-grid" :class="{ reverse: index % 2 === 1 }">
        <div class="copy">
          <p class="eyebrow">{{ eyebrow }}</p>
          <h2 ref="titleEl" class="display title">{{ title }}</h2>
          <p ref="bodyEl" class="body">{{ body }}</p>
        </div>
        <p ref="numEl" class="display index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import type { PaletteName } from '~/webgl/palettes'

const props = defineProps<{
  eyebrow: string
  title: string
  body: string
  palette: PaletteName
  index: number
}>()

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)
const numEl = ref<HTMLElement | null>(null)
const aura = useAura()

let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })

    // 핀 + 스크럽: 섹션이 화면에 고정된 채 스크롤 양으로 타임라인을 문지른다
    gsap
      .timeline({
        scrollTrigger: {
          trigger: rootEl.value,
          start: 'top top',
          end: '+=140%',
          pin: '.narrative-sticky',
          scrub: 0.6,
          // 섹션 진입 시 전역 아우라 팔레트 모핑 — 원본의 색 전환 재현
          onEnter: () => aura.setPalette(props.palette),
          onEnterBack: () => aura.setPalette(props.palette),
          onToggle: (self) => self.isActive && tween.play(),
        },
      })
      // 거대한 섹션 번호가 패럴랙스로 흐른다
      .fromTo(numEl.value, { yPercent: 60, autoAlpha: 0 }, { yPercent: -40, autoAlpha: 0.18, ease: 'none' }, 0)
      .from(bodyEl.value, { autoAlpha: 0, y: 40, ease: 'none', duration: 0.3 }, 0.05)
      .to({}, { duration: 0.6 }, 0.4) // 읽을 시간 확보용 홀드

    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.narrative {
  position: relative;
}

.narrative-sticky {
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.narrative-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  align-items: center;
  gap: 2rem;
}

.narrative-grid.reverse {
  direction: rtl;
}

.narrative-grid.reverse > * {
  direction: ltr;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.title {
  font-size: var(--text-xl);
  white-space: pre-line;
}

.body {
  color: var(--ink-muted);
  max-width: 36rem;
}

.index {
  font-size: clamp(8rem, 24vw, 22rem);
  line-height: 1;
  text-align: center;
  color: var(--ink);
  opacity: 0.18;
}

@media (max-width: 768px) {
  .narrative-grid {
    grid-template-columns: 1fr;
  }

  .index {
    display: none;
  }
}
</style>
