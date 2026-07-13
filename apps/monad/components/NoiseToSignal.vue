<template>
  <section ref="rootEl" class="noise">
    <div class="container grid-layout">
      <div class="copy">
        <p class="eyebrow">Signal quality</p>
        <h2 ref="titleEl" class="display title">From noise<br />to signal</h2>
        <p ref="bodyEl" class="body">
          중복되고 저가치인 이벤트를 걷어내면, 팀이 실제로 봐야 할 신호만 남습니다. 평균적으로 SIEM 수집
          볼륨을 60% 이상 줄입니다.
        </p>
      </div>
      <div ref="fieldEl" class="field" aria-hidden="true">
        <span ref="badgeEl" class="badge mono">noise -0%</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const badgeEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined

const COUNT = 72
const COLS = 9

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })
    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 62%',
      onEnter: () => {
        tween.play()
        gsap.from(bodyEl.value, { autoAlpha: 0, y: 24, duration: 0.8, ease: 'power3.out' })
      },
    })

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

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      dots.forEach((d) => {
        d.el.style.left = `${d.gx}%`
        d.el.style.top = `${d.gy}%`
        d.el.style.background = 'var(--signal)'
      })
      return () => split.revert()
    }

    dots.forEach((d) => {
      d.el.style.left = `${d.nx}%`
      d.el.style.top = `${d.ny}%`
    })

    ScrollTrigger.create({
      trigger: fieldEl.value,
      start: 'top 85%',
      end: 'bottom 40%',
      scrub: 0.6,
      onUpdate: (self) => {
        const t = self.progress
        for (const d of dots) {
          d.el.style.left = `${lerp(d.nx, d.gx, t)}%`
          d.el.style.top = `${lerp(d.ny, d.gy, t)}%`
        }
        fieldEl.value!.style.setProperty('--mix', t.toString())
        // 정렬 진행도가 곧 노이즈 감축률 — 스크럽에 직결
        if (badgeEl.value) badgeEl.value.textContent = `noise -${Math.round(t * 63)}%`
      },
    })

    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.noise {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 4rem 0;
}

.grid-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 3rem;
  align-items: center;
}

.copy {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  max-width: 28rem;
}

.title {
  font-size: var(--text-xl);
}

.body {
  color: var(--ink-muted);
}

.field {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--line);
  border-radius: 1rem;
  --mix: 0;
}

.badge {
  position: absolute;
  top: 0.8rem;
  right: 1rem;
  font-size: var(--text-sm);
  color: var(--signal);
  letter-spacing: 0.08em;
}

.field :deep(.dot) {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  translate: -50% -50%;
  background: color-mix(in srgb, var(--noise) calc((1 - var(--mix)) * 100%), var(--signal) calc(var(--mix) * 100%));
}

@media (max-width: 768px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }
}
</style>
