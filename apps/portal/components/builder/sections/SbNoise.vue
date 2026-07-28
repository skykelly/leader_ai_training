<template>
  <section ref="rootEl" class="sb-noise sb-container">
    <div class="copy">
      <p class="sb-eyebrow">{{ section.eyebrow }}</p>
      <h2 class="sb-display title">{{ section.title }}</h2>
      <p class="body">{{ section.body }}</p>
    </div>
    <div ref="fieldEl" class="field" aria-hidden="true">
      <span ref="badgeEl" class="badge">noise -0%</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { NoiseSection } from '~/types/site'

defineProps<{ section: NoiseSection }>()

const COUNT = 63
const COLS = 9

const rootEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const badgeEl = ref<HTMLElement | null>(null)
const scroller = inject<Ref<HTMLElement | null>>('sb-scroller', ref(null))
let ctx: gsap.Context | undefined

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

onMounted(() => {
  // monad NoiseToSignal 패턴 — 무작위 점들이 스크럽 진행도에 따라 그리드로 정렬된다
  const dots: { el: HTMLElement; nx: number; ny: number; gx: number; gy: number }[] = []
  const rows = Math.ceil(COUNT / COLS)
  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('span')
    el.className = 'dot'
    fieldEl.value!.appendChild(el)
    const col = i % COLS
    const row = Math.floor(i / COLS)
    dots.push({
      el,
      nx: Math.random() * 100,
      ny: Math.random() * 100,
      gx: ((col + 0.5) / COLS) * 100,
      gy: ((row + 0.5) / rows) * 100,
    })
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dots.forEach((d) => {
      d.el.style.left = `${d.gx}%`
      d.el.style.top = `${d.gy}%`
    })
    fieldEl.value!.style.setProperty('--mix', '1')
    if (badgeEl.value) badgeEl.value.textContent = 'noise -63%'
    return
  }

  dots.forEach((d) => {
    d.el.style.left = `${d.nx}%`
    d.el.style.top = `${d.ny}%`
  })

  ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: fieldEl.value,
      scroller: scroller.value ?? undefined,
      start: 'top 85%',
      end: 'bottom 45%',
      scrub: 0.6,
      onUpdate: (self) => {
        const t = self.progress
        for (const d of dots) {
          d.el.style.left = `${lerp(d.nx, d.gx, t)}%`
          d.el.style.top = `${lerp(d.ny, d.gy, t)}%`
        }
        fieldEl.value!.style.setProperty('--mix', t.toString())
        if (badgeEl.value) badgeEl.value.textContent = `noise -${Math.round(t * 63)}%`
      },
    })
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.sb-noise {
  min-height: 86vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 3rem;
  padding-block: 3.5rem;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: 28rem;
}

.title {
  font-size: clamp(1.7rem, 3.4vw, 2.8rem);
}

.body {
  color: var(--sb-ink-muted);
}

.field {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--sb-line);
  border-radius: 1rem;
  --mix: 0;
}

.badge {
  position: absolute;
  top: 0.7rem;
  right: 0.9rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  color: var(--sb-accent);
}

.field :deep(.dot) {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  translate: -50% -50%;
  background: color-mix(in srgb, var(--sb-ink-faint) calc((1 - var(--mix)) * 100%), var(--sb-accent) calc(var(--mix) * 100%));
}

@media (max-width: 720px) {
  .sb-noise {
    grid-template-columns: 1fr;
    min-height: auto;
  }
}
</style>
