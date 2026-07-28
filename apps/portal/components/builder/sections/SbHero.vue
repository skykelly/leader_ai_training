<template>
  <section class="sb-hero sb-container">
    <p class="sb-eyebrow">{{ section.eyebrow }}</p>
    <h1 ref="titleEl" class="sb-display title split-mask">{{ section.title }}</h1>
    <p class="tagline">{{ section.tagline }}</p>
    <p class="hint">Scroll ↓</p>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import type { HeroSection } from '~/types/site'

const props = defineProps<{ section: HeroSection }>()

const titleEl = ref<HTMLElement | null>(null)
let split: { revert(): void } | null = null

function runReveal(immediate = false) {
  if (!titleEl.value) return
  split?.revert()
  const r = splitRevealTween(titleEl.value, immediate ? { duration: 0.6, stagger: 0.015 } : { delay: 0.1 })
  split = r.split
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  runReveal()
  gsap.from('.sb-hero .tagline, .sb-hero .hint', { autoAlpha: 0, y: 18, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.35 })
})

// 빌더에서 타이틀을 수정하면 다시 쪼개서 즉시 리빌 — SplitText가 쪼개놓은 DOM은
// Vue가 패치하지 못하므로 revert 후 textContent를 직접 갱신하고 다시 쪼갠다
watch(
  () => props.section.title,
  async () => {
    await nextTick()
    if (!titleEl.value) return
    split?.revert()
    split = null
    titleEl.value.textContent = props.section.title
    runReveal(true)
  },
)

onBeforeUnmount(() => split?.revert())
</script>

<style scoped>
.sb-hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.4rem;
}

.title {
  font-size: clamp(2.4rem, 7vw, 5.6rem);
  white-space: pre-line;
}

.tagline {
  color: var(--sb-ink-muted);
  max-width: 34rem;
}

.hint {
  margin-top: 2.6rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.3em;
  color: var(--sb-ink-faint);
  text-transform: uppercase;
}
</style>
