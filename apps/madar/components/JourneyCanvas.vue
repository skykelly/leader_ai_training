<template>
  <div v-if="reduced" class="journey-fallback" aria-hidden="true" />
  <template v-else>
    <canvas ref="canvasEl" class="journey-canvas" aria-hidden="true" />
    <!-- 3D 웨이포인트를 화면 좌표로 투영해 따라붙는 정류장 라벨 — 활성 노드만 표시 -->
    <div class="wp-labels" aria-hidden="true">
      <div
        v-for="(label, i) in labels"
        :key="label"
        ref="labelEls"
        class="wp-label"
        :class="{ active: i === activeIdx }"
      >
        {{ label }}
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { waypointLabels } from '~/data/sections'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const labelEls = ref<HTMLElement[]>([])
const reduced = ref(false)
const activeIdx = ref(-1)
const labels = waypointLabels
const journey = useJourney()
let scrollTrigger: ScrollTrigger | undefined
let labelTicker: (() => void) | undefined

onMounted(async () => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value || !canvasEl.value) return
  const scene = await journey.init(canvasEl.value)
  // 터치 기기: 커서가 없으니 시선이 자동으로 천천히 순회한다
  if (window.matchMedia('(pointer: coarse)').matches) scene.setAutoWander(true)

  // 문서 전체 스크롤 진행도(0..1)가 곧 경로 위 카메라 위치가 된다
  scrollTrigger = ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => journey.setProgress(self.progress),
  })

  // 매 프레임 웨이포인트 화면 좌표를 라벨 transform으로 반영
  labelTicker = () => {
    const data = scene.getLabelData()
    activeIdx.value = scene.activeIndex
    labelEls.value.forEach((el, i) => {
      const d = data[i]
      if (!d) return
      el.style.transform = `translate(${d.x}px, ${d.y}px)`
      el.style.visibility = d.visible ? 'visible' : 'hidden'
    })
  }
  gsap.ticker.add(labelTicker)
})

onBeforeUnmount(() => {
  if (labelTicker) gsap.ticker.remove(labelTicker)
  scrollTrigger?.kill()
  journey.destroy()
})
</script>

<style scoped>
.journey-canvas,
.journey-fallback {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  background: var(--bg);
}

.journey-fallback {
  background:
    linear-gradient(135deg, rgba(255, 99, 64, 0.18), transparent 60%),
    var(--bg);
}

.wp-labels {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.wp-label {
  position: absolute;
  top: 0;
  left: 0;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink);
  /* transform이 라벨의 좌상단을 노드에 붙이므로, 살짝 우상단으로 띄운다 */
  margin: -2.2rem 0 0 0.9rem;
  padding: 0.25rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(23, 46, 100, 0.55);
  backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity 0.3s ease;
  white-space: nowrap;
}

.wp-label.active {
  opacity: 1;
}
</style>
