<template>
  <main>
    <header class="top container">
      <p class="display logo">Scroll Study<span class="star">*</span></p>
      <p class="eyebrow count">{{ libraries.length }} libraries</p>
    </header>

    <section class="hero container">
      <p class="eyebrow reveal-fade">Award-winning interactions, rebuilt one by one</p>
      <h1 ref="titleEl" class="display hero-title">Scrollytelling
Study Library</h1>
      <p class="lede reveal-fade">
        어워드 수상 사이트들의 스크롤리텔링·인터랙션 기법을 하나씩 따라 만드는 학습 클론 컬렉션입니다.
        각 라이브러리는 독립된 데모와 함께, 어떤 기법을 어떻게 구현했는지 기록합니다.
      </p>
    </section>

    <section class="grid container">
      <LibraryCard v-for="(lib, i) in libraries" :key="lib.slug" :lib="lib" :index="i" class="reveal-card" />
      <div class="coming reveal-card">
        <p class="display plus">+</p>
        <p class="eyebrow">Next library</p>
        <p class="coming-note">다음 클론이 이 자리에 추가됩니다.</p>
      </div>
    </section>

    <footer class="footer container">
      <p class="eyebrow">Scroll Study Library</p>
      <p class="note">모든 클론은 학습 목적으로 원본 사이트의 기법만을 재현하며, 콘텐츠와 브랜딩은 자체 제작입니다.</p>
    </footer>
  </main>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { libraries } from '~/data/libraries'

const titleEl = ref<HTMLElement | null>(null)
let split: SplitText | null = null

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  split = new SplitText(titleEl.value!, { type: 'lines,chars', linesClass: 'line', mask: 'lines' })
  gsap
    .timeline()
    .from(split.chars, { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.02 }, 0.1)
    .from('.reveal-fade', { autoAlpha: 0, y: 22, duration: 0.8, ease: 'power3.out', stagger: 0.12 }, 0.3)
    .from('.reveal-card', { autoAlpha: 0, y: 46, duration: 0.9, ease: 'power3.out', stagger: 0.12 }, 0.5)
})

onBeforeUnmount(() => split?.revert())
</script>

<style scoped>
.top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 1.6rem;
}

.logo {
  font-size: 1.15rem;
}

.star {
  color: var(--accent);
}

.hero {
  padding: 16vh 0 10vh;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

.hero-title {
  font-size: var(--text-hero);
  white-space: pre-line;
}

.lede {
  color: var(--ink-muted);
  max-width: 40rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 3rem 2.5rem;
  padding-bottom: 14vh;
}

.coming {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  border: 1px dashed var(--line);
  border-radius: 0.9rem;
  min-height: 16rem;
  text-align: center;
}

.plus {
  font-size: 2.4rem;
  color: var(--ink-faint);
}

.coming-note {
  color: var(--ink-faint);
  font-size: var(--text-sm);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--line);
  padding-block: 2.2rem 3rem;
}

.note {
  color: var(--ink-faint);
  font-size: var(--text-sm);
  max-width: 34rem;
}
</style>
