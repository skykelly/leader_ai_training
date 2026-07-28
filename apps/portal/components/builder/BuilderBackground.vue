<template>
  <div v-if="reduced || kind === 'none'" class="bg-none" aria-hidden="true" />
  <!-- WebGL 컨텍스트는 캔버스에 묶이므로 씬 종류가 바뀌면 :key로 캔버스를 새로 만든다 -->
  <div v-else class="bg-host" aria-hidden="true">
    <canvas :key="kind" ref="canvasEl" class="bg-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { BackgroundKind, SiteTheme } from '~/types/site'

interface BackgroundScene {
  dispose(): void
  setColors(colors: string[]): void
  setAutoWander(on: boolean): void
  setBoost?(value: number): void
  setProgress?(value: number): void
}

const props = defineProps<{
  kind: BackgroundKind
  theme: SiteTheme
  /** SitePreview의 스크롤 컨테이너 — 부스트/진행도 연동에 쓴다 */
  scroller: HTMLElement | null
  /** 스크롤되는 콘텐츠 래퍼 — 전체 진행도의 trigger */
  content: HTMLElement | null
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = ref(false)
let scene: BackgroundScene | null = null
let scrollTrigger: ScrollTrigger | undefined

// 테마 → 씬 색 매핑 (씬별 기대 색 수가 다르다)
function sceneColors(kind: BackgroundKind, theme: SiteTheme): string[] {
  if (kind === 'orbit') return [theme.accent]
  return [theme.accent, theme.accent2, theme.ink]
}

function destroy() {
  scrollTrigger?.kill()
  scrollTrigger = undefined
  scene?.dispose()
  scene = null
}

async function mount() {
  destroy()
  const canvas = canvasEl.value
  const kind = props.kind
  if (!canvas || kind === 'none') return

  const colors = sceneColors(kind, props.theme)
  if (kind === 'flow') {
    const { FlowScene } = await import('scrollkit/webgl/FlowScene')
    scene = new FlowScene(canvas, { colors })
  } else if (kind === 'warp') {
    const { WarpScene } = await import('scrollkit/webgl/WarpScene')
    scene = new WarpScene(canvas, { colors })
  } else {
    const { OrbitScene } = await import('scrollkit/webgl/OrbitScene')
    scene = new OrbitScene(canvas, { colors })
  }
  // await 사이에 kind가 또 바뀌었으면 이 씬은 폐기
  if (kind !== props.kind || canvas !== canvasEl.value) {
    scene.dispose()
    scene = null
    return
  }

  if (window.matchMedia('(pointer: coarse)').matches) scene.setAutoWander(true)

  // 프리뷰 컨테이너의 스크롤에 연동 — flow/warp는 속도 부스트, orbit은 진행도
  if (props.scroller && props.content) {
    scrollTrigger = ScrollTrigger.create({
      scroller: props.scroller,
      trigger: props.content,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (!scene) return
        scene.setProgress?.(self.progress)
        scene.setBoost?.(Math.min(1.5, Math.abs(self.getVelocity()) / 1200))
      },
    })
    scene.setProgress?.(Math.max(0.3, scrollTrigger.progress))
  } else {
    scene.setProgress?.(0.5)
  }
}

watch(
  () => props.kind,
  async () => {
    await nextTick() // :key 교체로 새 캔버스가 생긴 뒤에 씬을 만든다
    await mount()
  },
)
watch(
  () => props.theme,
  (theme) => scene?.setColors(sceneColors(props.kind, theme)),
  { deep: true },
)

onMounted(async () => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value) return
  await nextTick()
  await mount()
})

onBeforeUnmount(destroy)
</script>

<style scoped>
.bg-host,
.bg-none {
  position: absolute;
  inset: 0;
}

.bg-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.bg-none {
  background: radial-gradient(42% 36% at 50% 40%, color-mix(in srgb, var(--sb-accent) 10%, transparent), transparent 70%);
}
</style>
