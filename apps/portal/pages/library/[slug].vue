<template>
  <main v-if="lib" :style="{ '--card-accent': lib.accent }">
    <header class="top container">
      <NuxtLink to="/" class="display logo">Scroll Study<span class="star">*</span></NuxtLink>
      <NuxtLink to="/" class="eyebrow back">← All libraries</NuxtLink>
    </header>

    <article class="container">
      <section class="hero">
        <p class="eyebrow">
          Library {{ String(idx + 1).padStart(2, '0') }} · {{ lib.year }} · 원본:
          <a :href="lib.original.url" target="_blank" rel="noopener" class="orig">{{ lib.original.name }} ↗</a>
        </p>
        <h1 ref="titleEl" class="display title">{{ lib.title }}</h1>
        <p class="subtitle">{{ lib.titleKo }}</p>

        <div class="actions reveal-fade">
          <a :href="demoUrl" class="demo-btn display">Live demo 열기 →</a>
          <div class="chips">
            <span v-for="s in lib.stack" :key="s" class="chip">{{ s }}</span>
          </div>
        </div>
      </section>

      <figure class="thumb-wrap reveal-fade">
        <img :src="thumbSrc" :alt="`${lib.title} 클론 스크린샷`" class="thumb" />
      </figure>

      <section class="body-grid">
        <div class="summary reveal-fade">
          <h2 class="eyebrow">About this clone</h2>
          <p>{{ lib.summary }}</p>
        </div>

        <div class="techniques">
          <h2 class="eyebrow">Techniques — 무엇을 어떻게 재현했나</h2>
          <dl>
            <div v-for="(t, i) in lib.techniques" :key="i" class="tech reveal-fade">
              <dt class="display tech-name">
                <span class="tech-num">{{ String(i + 1).padStart(2, '0') }}</span>{{ t.name }}
              </dt>
              <dd class="tech-how">{{ t.how }}</dd>
              <dd v-if="t.file" class="tech-file"><code>{{ t.file }}</code></dd>
            </div>
          </dl>
        </div>
      </section>

      <nav class="pager">
        <NuxtLink v-if="prev" :to="`/library/${prev.slug}`" class="pager-link">
          <span class="eyebrow">← Prev</span>
          <span class="display pager-name">{{ prev.title }}</span>
        </NuxtLink>
        <span v-else />
        <NuxtLink v-if="next" :to="`/library/${next.slug}`" class="pager-link align-right">
          <span class="eyebrow">Next →</span>
          <span class="display pager-name">{{ next.title }}</span>
        </NuxtLink>
      </nav>
    </article>
  </main>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { libraries, getLibrary } from '~/data/libraries'

const route = useRoute()
const lib = computed(() => getLibrary(route.params.slug as string))

if (!lib.value) {
  throw createError({ statusCode: 404, statusMessage: 'Library not found' })
}

const idx = computed(() => libraries.findIndex((l) => l.slug === lib.value!.slug))
const prev = computed(() => libraries[idx.value - 1])
const next = computed(() => libraries[idx.value + 1])

const base = useRuntimeConfig().app.baseURL
const thumbSrc = computed(() => base + lib.value!.thumb)
// 라이브 데모는 같은 Pages 사이트의 서브패스에 배포된다
const demoUrl = computed(() => base + lib.value!.slug + '/')

const titleEl = ref<HTMLElement | null>(null)
let split: SplitText | null = null

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  split = new SplitText(titleEl.value!, { type: 'lines,chars', linesClass: 'line', mask: 'lines' })
  gsap
    .timeline()
    .from(split.chars, { yPercent: 115, duration: 0.9, ease: 'power4.out', stagger: 0.02 }, 0.05)
    .from('.reveal-fade', { autoAlpha: 0, y: 24, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, 0.25)
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

.back {
  color: var(--ink-muted);
}

.back:hover {
  color: var(--ink);
}

.hero {
  padding: 10vh 0 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.orig {
  color: var(--ink);
  border-bottom: 1px solid var(--line);
}

.orig:hover {
  color: var(--card-accent);
}

.title {
  font-size: var(--text-hero);
}

.subtitle {
  color: var(--ink-muted);
  font-size: var(--text-lg);
}

.actions {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  flex-wrap: wrap;
  margin-top: 1.2rem;
}

.demo-btn {
  padding: 0.9em 2em;
  border: 1px solid var(--ink);
  border-radius: 999px;
  font-size: var(--text-sm);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition:
    background-color 0.3s var(--ease-out),
    color 0.3s var(--ease-out),
    border-color 0.3s var(--ease-out);
}

.demo-btn:hover {
  background: var(--card-accent);
  border-color: var(--card-accent);
  color: var(--bg);
}

.chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.thumb-wrap {
  overflow: hidden;
  border-radius: 1rem;
  background: var(--panel);
}

.thumb {
  width: 100%;
}

.body-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 3.5rem;
  padding: 5rem 0 4rem;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--ink-muted);
}

.techniques {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.tech {
  border-top: 1px solid var(--line);
  padding-top: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tech-name {
  font-size: var(--text-lg);
}

.tech-num {
  color: var(--card-accent);
  font-size: var(--text-sm);
  vertical-align: super;
  margin-right: 0.7rem;
}

.tech-how {
  color: var(--ink-muted);
}

.tech-file code {
  font-size: 0.82rem;
  color: var(--ink-faint);
  background: var(--panel);
  padding: 0.2em 0.6em;
  border-radius: 0.4em;
}

.pager {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid var(--line);
  padding: 2.2rem 0 4rem;
}

.pager-link {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.pager-link.align-right {
  text-align: right;
}

.pager-name {
  font-size: var(--text-lg);
}

.pager-link:hover .pager-name {
  color: var(--card-accent);
}

@media (max-width: 820px) {
  .body-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}
</style>
