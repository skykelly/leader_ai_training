<template>
  <section ref="rootEl" class="sb-cta sb-container">
    <h2 ref="titleEl" class="sb-display title split-mask">{{ section.title }}</h2>
    <p class="body">{{ section.body }}</p>
    <ScrollMagneticButton class="btn">{{ section.button }}</ScrollMagneticButton>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { CtaSection } from '~/types/site'

const props = defineProps<{ section: CtaSection }>()

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const scroller = inject<Ref<HTMLElement | null>>('sb-scroller', ref(null))
let ctx: gsap.Context | undefined
let split: { revert(): void } | null = null
let revealed = false

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    const r = splitRevealTween(titleEl.value!, { paused: true })
    split = r.split
    ScrollTrigger.create({
      trigger: rootEl.value,
      scroller: scroller.value ?? undefined,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        revealed = true
        r.tween.play()
        gsap.from(rootEl.value!.querySelectorAll('.body, .btn'), { autoAlpha: 0, y: 20, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.2 })
      },
    })
  }, rootEl.value!)
})

// 빌더에서 타이틀 수정 시: 이미 리빌됐다면 다시 쪼개서 즉시 재생.
// SplitText가 쪼개놓은 DOM은 Vue가 패치하지 못하므로 textContent를 직접 갱신한다
watch(
  () => props.section.title,
  async () => {
    if (!revealed || !titleEl.value) return
    await nextTick()
    split?.revert()
    titleEl.value.textContent = props.section.title
    const r = splitRevealTween(titleEl.value, { duration: 0.6, stagger: 0.015 })
    split = r.split
  },
)

onBeforeUnmount(() => {
  ctx?.revert()
  split?.revert()
})
</script>

<style scoped>
.sb-cta {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
  text-align: center;
  padding-block: 4rem;
}

.title {
  font-size: clamp(2rem, 4.6vw, 3.6rem);
}

.body {
  color: var(--sb-ink-muted);
  max-width: 30rem;
}

.btn {
  margin-top: 1rem;
  --ink: var(--sb-ink);
  --bg: var(--sb-bg);
}
</style>
