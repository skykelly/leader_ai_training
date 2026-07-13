<template>
  <div ref="rootEl" class="distort-wrap" aria-hidden="true">
    <canvas ref="canvasEl" class="distort-canvas" />
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import gsap from 'gsap'

const props = defineProps<{ label: string; tint: string }>()

const rootEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | undefined
let material: THREE.ShaderMaterial | undefined
let tickerFn: (() => void) | undefined
let observer: IntersectionObserver | undefined
let inView = false
let distort = 0

/** 외부 이미지 없이 자체 제작하는 "필름 스틸" 텍스처 — 네온 그라디언트 + 스캔라인 + 라벨 */
function makeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 400
  const ctx = c.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 640, 400)
  grad.addColorStop(0, '#120e1f')
  grad.addColorStop(0.55, props.tint)
  grad.addColorStop(1, '#08060f')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 640, 400)

  // 스캔라인 — 전송 중인 푸티지의 질감
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
  for (let y = 0; y < 400; y += 4) ctx.fillRect(0, y, 640, 2)

  ctx.fillStyle = 'rgba(245, 244, 251, 0.92)'
  ctx.font = '700 64px "Space Grotesk Variable", sans-serif'
  ctx.fillText(props.label, 36, 220)
  ctx.font = '500 20px "Space Grotesk Variable", sans-serif'
  ctx.fillStyle = 'rgba(245, 244, 251, 0.55)'
  ctx.fillText('4K · 24fps · ENCRYPTED', 38, 260)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const canvas = canvasEl.value!

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 640 / 400, 0.1, 10)
  camera.position.z = 1.15

  material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uDistort: { value: 0 },
      uMap: { value: makeTexture() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uDistort;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        // 스크롤 속도에 비례해 물결치고(z) 진행 방향으로 휘어진다(x)
        pos.z += sin(pos.x * 6.0 + uTime * 2.0) * uDistort * 0.08;
        pos.x += uDistort * pow(uv.y - 0.5, 2.0) * 0.4;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uMap;
      uniform float uDistort;
      varying vec2 vUv;
      void main() {
        // 왜곡이 클수록 RGB 채널이 살짝 어긋나는 색수차
        float shift = uDistort * 0.008;
        vec4 c;
        c.r = texture2D(uMap, vUv + vec2(shift, 0.0)).r;
        c.g = texture2D(uMap, vUv).g;
        c.b = texture2D(uMap, vUv - vec2(shift, 0.0)).b;
        c.a = 1.0;
        gl_FragColor = c;
      }
    `,
  })

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.62, 32, 32), material)
  scene.add(mesh)

  function resize() {
    const rect = rootEl.value!.getBoundingClientRect()
    renderer!.setSize(rect.width, rect.width * 0.62)
  }
  resize()

  // 화면 밖 패널은 렌더 정지 — 패널 3개가 동시에 GPU를 쓰지 않도록
  observer = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0.05 })
  observer.observe(rootEl.value!)

  let lastY = window.scrollY
  let lastT = gsap.ticker.time
  tickerFn = () => {
    const now = gsap.ticker.time
    const dt = Math.max(now - lastT, 0.001)
    lastT = now
    const y = window.scrollY
    const velocity = (y - lastY) / dt // px/s
    lastY = y
    if (!inView) return
    const target = Math.min(1.2, Math.abs(velocity) / 1200)
    distort += (target - distort) * 0.08
    material!.uniforms.uTime.value = now
    material!.uniforms.uDistort.value = distort
    renderer!.render(scene, camera)
  }
  gsap.ticker.add(tickerFn)
  window.addEventListener('resize', resize)
  onBeforeUnmount(() => window.removeEventListener('resize', resize))
})

onBeforeUnmount(() => {
  if (tickerFn) gsap.ticker.remove(tickerFn)
  observer?.disconnect()
  material?.dispose()
  renderer?.dispose()
})
</script>

<style scoped>
.distort-wrap {
  width: 100%;
  max-width: 30rem;
  justify-self: center;
}

.distort-canvas {
  width: 100%;
  height: auto;
  display: block;
}
</style>
