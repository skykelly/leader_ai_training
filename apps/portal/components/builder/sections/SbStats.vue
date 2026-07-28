<template>
  <section ref="rootEl" class="sb-stats sb-container">
    <h2 class="sb-display title">{{ section.title }}</h2>
    <div class="grid">
      <div v-for="item in section.items" :key="item.label" class="card">
        <p class="value sb-display"><span ref="numEls" :data-target="item.value">0</span>{{ item.suffix }}</p>
        <p class="label">{{ item.label }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { StatsSection } from '~/types/site'

defineProps<{ section: StatsSection }>()

const rootEl = ref<HTMLElement | null>(null)
const numEls = ref<HTMLElement[]>([])
const scroller = inject<Ref<HTMLElement | null>>('sb-scroller', ref(null))
let ctx: gsap.Context | undefined

// madar StatsSection의 proxy 트윈 카운트업 패턴
function countUp() {
  numEls.value.forEach((el) => {
    const target = Number(el.dataset.target)
    const decimals = target % 1 !== 0 ? 1 : 0
    const proxy = { v: 0 }
    gsap.to(proxy, {
      v: target,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = proxy.v.toFixed(decimals)
      },
    })
  })
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    numEls.value.forEach((el) => (el.textContent = el.dataset.target ?? ''))
    return
  }
  ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: rootEl.value,
      scroller: scroller.value ?? undefined,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        gsap.from(rootEl.value!.querySelectorAll('.card'), { autoAlpha: 0, y: 28, duration: 0.8, stagger: 0.1, ease: 'power3.out' })
        countUp()
      },
    })
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.sb-stats {
  min-height: 64vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 3.5rem;
}

.title {
  font-size: clamp(1.7rem, 3.4vw, 2.8rem);
  margin-bottom: 2.6rem;
  max-width: 22ch;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 1.2rem;
}

.card {
  padding: 1.8rem 1.4rem;
  border: 1px solid var(--sb-line);
  border-radius: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.value {
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  color: var(--sb-accent);
}

.label {
  color: var(--sb-ink-muted);
  font-size: var(--text-sm);
}
</style>
