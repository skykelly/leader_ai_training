<template>
  <div v-if="reduced" class="bg-wrap bg-fallback" aria-hidden="true" />
  <!-- 래퍼가 씬의 크기 기준(host)이 된다. WebGL 컨텍스트는 캔버스에 묶이므로
       씬 종류가 바뀌면 :key로 캔버스 자체를 새로 만든다 -->
  <div v-else class="bg-wrap" aria-hidden="true">
    <canvas :key="kind" ref="canvasEl" class="bg-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export type BackgroundKind = 'flow' | 'warp' | 'orbit'

interface BackgroundScene {
  dispose(): void
  setColors(colors: string[]): void
  setAutoWander(on: boolean): void
  setBoost?(value: number): void
  setProgress?(value: number): void
}

const props = defineProps<{ kind: BackgroundKind; colors?: string[] }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = ref(false)
let scene: BackgroundScene | null = null
let scrollTrigger: ScrollTrigger | undefined

function destroy() {
  scrollTrigger?.kill()
  scrollTrigger = undefined
  scene?.dispose()
  scene = null
}

async function mount() {
  destroy()
  const canvas = canvasEl.value
  if (!canvas) return
  const kind = props.kind

  if (kind === 'flow') {
    const { FlowScene } = await import('scrollkit/webgl/FlowScene')
    scene = new FlowScene(canvas, { colors: props.colors })
  } else if (kind === 'warp') {
    const { WarpScene } = await import('scrollkit/webgl/WarpScene')
    scene = new WarpScene(canvas, { colors: props.colors })
  } else {
    const { OrbitScene } = await import('scrollkit/webgl/OrbitScene')
    scene = new OrbitScene(canvas, { colors: props.colors })
  }
  // await 사이에 kind가 또 바뀌었으면 이 씬은 폐기
  if (kind !== props.kind || canvas !== canvasEl.value) {
    scene.dispose()
    scene = null
    return
  }

  // 터치 기기: 커서가 없으니 시선이 자동으로 천천히 순회한다
  if (window.matchMedia('(pointer: coarse)').matches) scene.setAutoWander(true)

  // 스크롤 연동 — flow/warp는 속도가 가속 페달, orbit은 진행도가 리빌/카메라
  scrollTrigger = ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      if (!scene) return
      if (scene.setProgress) scene.setProgress(self.progress)
      scene.setBoost?.(Math.min(1.5, Math.abs(self.getVelocity()) / 1200))
    },
  })
  // orbit은 스크롤 전에도 첫 링이 보이도록 초기 진행도를 준다
  scene.setProgress?.(Math.max(0.3, scrollTrigger.progress))
}

watch(
  () => props.kind,
  async () => {
    await nextTick() // :key 교체로 새 캔버스가 생긴 뒤에 씬을 만든다
    await mount()
  },
)
watch(
  () => props.colors,
  (colors) => {
    if (colors) scene?.setColors(colors)
  },
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
.bg-wrap {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  background: var(--bg);
}

.bg-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.bg-fallback {
  background:
    radial-gradient(40% 34% at 50% 42%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
    var(--bg);
}
</style>
