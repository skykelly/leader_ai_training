<template>
  <main ref="stageEl" class="stage" :class="{ ready }">
    <WaveLoader @done="onLoaderDone" />

    <SlideSection
      v-for="(s, i) in slides"
      v-show="reduced || i === slider.index.value"
      :key="s.id"
      :slide="s"
      :active="ready && i === slider.index.value"
      :animate="!reduced"
    />

    <WaveOverlay ref="waveEl" />
    <DotNav v-if="!reduced" :slides="slides" :index="slider.index.value" @select="slider.goTo" />

    <header class="brand display" :style="{ color: current.ink }">wrk<span :style="{ color: current.accent }">*</span></header>
    <p v-if="!reduced" class="counter eyebrow" :style="{ color: current.ink }">
      {{ String(slider.index.value + 1).padStart(2, '0') }} — {{ String(slides.length).padStart(2, '0') }}
    </p>

    <CursorDot />
  </main>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { slides } from '~/data/slides'

const waveEl = ref<{ sweep: (swap: () => void) => Promise<void> } | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const ready = ref(false)
const reduced = ref(false)

const slider = useSlider({
  count: slides.length,
  // 전환 = 웨이브 스윕: 화면이 완전히 덮인 순간 commit()으로 슬라이드가 교체된다
  onChange: (_to, _from, commit) => {
    if (!waveEl.value) {
      commit()
      return Promise.resolve()
    }
    return waveEl.value.sweep(commit)
  },
  // 잠금 중/끝 슬라이드에서의 입력은 무시하지 않고 "눌렸다 튕기는" 저항으로 답한다
  onResist: (dir) => {
    if (!stageEl.value) return
    gsap
      .timeline({ overwrite: 'auto' })
      .to(stageEl.value, { y: -12 * dir, duration: 0.18, ease: 'power2.out' })
      .to(stageEl.value, { y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
  },
})

const current = computed(() => slides[slider.index.value])

function onLoaderDone() {
  ready.value = true
}

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value) {
    document.body.classList.add('static-scroll')
    ready.value = true
    return
  }
  slider.init()
})

onBeforeUnmount(() => {
  slider.destroy()
  document.body.classList.remove('static-scroll')
})
</script>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  height: 100vh;
}

body.static-scroll .stage {
  height: auto;
}

.brand {
  position: fixed;
  top: 1.4rem;
  left: 1.8rem;
  z-index: 70;
  font-size: 1.3rem;
  letter-spacing: 0;
  transition: color 0.6s var(--ease-out);
}

.counter {
  position: fixed;
  bottom: 1.6rem;
  left: 1.8rem;
  z-index: 70;
  transition: color 0.6s var(--ease-out);
}
</style>
