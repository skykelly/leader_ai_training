<template>
  <section ref="rootEl" class="pillars">
    <div class="container">
      <p class="eyebrow">Why pioneer</p>
      <h2 class="display title">개척자의 세 가지 힘</h2>
      <div class="grid">
        <article v-for="(p, i) in pillars" :key="i" class="pillar">
          <p class="display stat"><span class="num" :data-target="p.value">0</span>{{ p.suffix }}</p>
          <h3 class="display name">{{ p.name }}</h3>
          <p class="desc">{{ p.desc }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const pillars = [
  { value: 87, suffix: '%', name: 'Vision', desc: '변화를 먼저 읽는 리더가 조직의 방향을 만듭니다.' },
  { value: 3, suffix: 'x', name: 'Momentum', desc: '실험하는 팀은 그렇지 않은 팀보다 3배 빠르게 배웁니다.' },
  { value: 100, suffix: '+', name: 'Frontiers', desc: '아직 아무도 걷지 않은 길이 우리 앞에 열려 있습니다.' },
]

const rootEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    // 뷰포트 진입 시 숫자 카운트업 + 카드 스태거 리빌
    gsap.from('.pillar', {
      autoAlpha: 0,
      y: 60,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.15,
      scrollTrigger: { trigger: rootEl.value, start: 'top 70%' },
    })

    gsap.utils.toArray<HTMLElement>('.num').forEach((el) => {
      const target = Number(el.dataset.target)
      const state = { v: 0 }
      gsap.to(state, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%' },
        onUpdate: () => (el.textContent = String(Math.round(state.v))),
      })
    })
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.pillars {
  padding: 20vh 0;
}

.title {
  font-size: var(--text-xl);
  margin: 1rem 0 4rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 2rem;
}

.pillar {
  border-top: 1px solid var(--line);
  padding-top: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.stat {
  font-size: var(--text-xl);
  background: linear-gradient(120deg, var(--accent-a), var(--accent-b));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.name {
  font-size: var(--text-lg);
}

.desc {
  color: var(--ink-muted);
}
</style>
