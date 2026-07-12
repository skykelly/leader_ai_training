<template>
  <main>
    <HeroSection />
    <NarrativeSection
      v-for="(s, i) in narrative"
      :key="s.title"
      :index="i"
      v-bind="s"
    />
    <AppMarquee text="Prepare to Pioneer" />
    <PillarsSection />
    <CtaSection />
    <AppFooter />
  </main>
</template>

<script setup lang="ts">
import type { PaletteName } from '~/webgl/palettes'

const aura = useAura()
onMounted(() => aura.setMode('flow'))

const narrative: {
  eyebrow: string
  title: string
  body: string
  palette: PaletteName
}[] = [
  {
    eyebrow: 'Chapter 01',
    title: 'New frontiers\nawait',
    body: 'AI가 모든 산업의 지도를 다시 그리고 있습니다. 지금 우리 앞에 놓인 것은 위기가 아니라, 아직 이름 붙지 않은 새로운 영토입니다.',
    palette: 'frontier',
  },
  {
    eyebrow: 'Chapter 02',
    title: 'Pioneers\ngo first',
    body: '개척자는 완벽한 지도를 기다리지 않습니다. 먼저 걸으며 지도를 그리는 사람, 실험과 실패를 연료로 삼는 사람입니다.',
    palette: 'power',
  },
  {
    eyebrow: 'Chapter 03',
    title: 'Unlock your\npioneering power',
    body: '누구에게나 고유한 개척의 방식이 있습니다. 당신의 아우라를 확인하고, 당신답게 앞서 나가는 법을 발견하세요.',
    palette: 'hero',
  },
]
</script>
