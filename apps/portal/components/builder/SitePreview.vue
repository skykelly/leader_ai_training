<template>
  <!-- 배경 레이어 위에 스크롤 레이어가 겹치는 구조 — 빌더 분할 화면과
       풀스크린 미리보기가 같은 컴포넌트를 쓴다(컨테이너 안에서 스크롤) -->
  <div class="site-preview" :style="themeVars">
    <div class="bg-layer">
      <BuilderBackground :kind="config.background" :theme="config.theme" :scroller="scrollerEl" :content="contentEl" />
    </div>
    <div ref="scrollerEl" class="scroll-layer">
      <div ref="contentEl" class="content">
        <component
          :is="SECTION_COMPONENTS[section.type]"
          v-for="section in config.sections"
          :key="section.id"
          :section="section"
          :data-type="section.type"
        />
        <p v-if="config.sections.length === 0" class="empty">왼쪽 패널에서 섹션을 추가해 보세요</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SiteConfig } from '~/types/site'
import SbHero from './sections/SbHero.vue'
import SbFeature from './sections/SbFeature.vue'
import SbStats from './sections/SbStats.vue'
import SbTimeline from './sections/SbTimeline.vue'
import SbNoise from './sections/SbNoise.vue'
import SbCta from './sections/SbCta.vue'

const props = defineProps<{ config: SiteConfig }>()

const SECTION_COMPONENTS = {
  hero: SbHero,
  feature: SbFeature,
  stats: SbStats,
  timeline: SbTimeline,
  noise: SbNoise,
  cta: SbCta,
} as const

const scrollerEl = ref<HTMLElement | null>(null)
const contentEl = ref<HTMLElement | null>(null)

// 섹션 컴포넌트들이 자신의 ScrollTrigger에 쓸 스크롤 컨테이너
provide('sb-scroller', scrollerEl)

const themeVars = computed(() => ({
  '--sb-bg': props.config.theme.bg,
  '--sb-ink': props.config.theme.ink,
  '--sb-ink-muted': `color-mix(in srgb, ${props.config.theme.ink} 62%, transparent)`,
  '--sb-ink-faint': `color-mix(in srgb, ${props.config.theme.ink} 34%, transparent)`,
  '--sb-line': `color-mix(in srgb, ${props.config.theme.ink} 14%, transparent)`,
  '--sb-accent': props.config.theme.accent,
  '--sb-accent2': props.config.theme.accent2,
}))

// 섹션 추가/삭제/순서 변경 시 트리거 위치 재계산
watch(
  () => props.config.sections.map((s) => s.id).join(','),
  async () => {
    await nextTick()
    ScrollTrigger.refresh()
  },
)
</script>

<style scoped>
.site-preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--sb-bg);
  color: var(--sb-ink);
}

.bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.scroll-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.content {
  position: relative;
}

.empty {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sb-ink-faint);
}
</style>
