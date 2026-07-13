<template>
  <section class="hero">
    <svg class="diagram" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g stroke="#3a4552" stroke-width="2" fill="none">
        <path ref="srcPath0" d="M60 120 C 300 120, 380 260, 560 330" />
        <path ref="srcPath1" d="M60 280 C 260 280, 380 300, 560 340" />
        <path ref="srcPath2" d="M60 440 C 260 440, 380 400, 560 360" />
        <path ref="srcPath3" d="M60 580 C 300 580, 400 420, 560 370" />
      </g>
      <path ref="outPath" d="M640 350 C 820 350, 900 350, 1140 350" stroke="#3a4552" stroke-width="2" fill="none" />

      <g fill="#151b23" stroke="#2a323d" stroke-width="1.5">
        <circle cx="60" cy="120" r="22" />
        <circle cx="60" cy="280" r="22" />
        <circle cx="60" cy="440" r="22" />
        <circle cx="60" cy="580" r="22" />
      </g>
      <g fill="var(--noise)" opacity="0.85">
        <circle cx="60" cy="120" r="5" />
        <circle cx="60" cy="280" r="5" />
        <circle cx="60" cy="440" r="5" />
        <circle cx="60" cy="580" r="5" />
      </g>

      <circle cx="600" cy="350" r="42" fill="#101620" stroke="var(--signal)" stroke-width="2" class="pipe-node" />
      <circle cx="600" cy="350" r="8" fill="var(--signal)" />

      <circle cx="1160" cy="350" r="22" fill="#151b23" stroke="var(--signal)" stroke-width="1.5" />
      <circle cx="1160" cy="350" r="5" fill="var(--signal)" />

      <g ref="particleGroup" fill="var(--noise)" />
    </svg>

    <div class="copy">
      <p class="eyebrow reveal">Security data pipelines, without the mess</p>
      <h1 ref="titleEl" class="display title">Every signal.<br />One clean pipe.</h1>
      <p class="lede reveal">50개가 넘는 보안 툴에서 쏟아지는 데이터를, 하나의 정돈된 파이프라인으로 모읍니다.</p>
      <MagneticButton class="reveal">See the pipeline →</MagneticButton>
    </div>

    <LogTicker />
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const srcPath0 = ref<SVGPathElement | null>(null)
const srcPath1 = ref<SVGPathElement | null>(null)
const srcPath2 = ref<SVGPathElement | null>(null)
const srcPath3 = ref<SVGPathElement | null>(null)
const outPath = ref<SVGPathElement | null>(null)
const particleGroup = ref<SVGGElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)

let ctx: gsap.Context | undefined
let tickerFn: (() => void) | undefined

interface Particle {
  el: SVGCircleElement
  path: SVGPathElement
  length: number
  phase: number
  speed: number
}

onMounted(() => {
  const { tween } = splitRevealTween(titleEl.value!, { delay: 0.1 })
  gsap.from('.hero .reveal', { autoAlpha: 0, y: 20, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.35 })

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduced) {
    ctx = gsap.context(() => {
      const sourcePaths = [srcPath0.value!, srcPath1.value!, srcPath2.value!, srcPath3.value!]
      const particles: Particle[] = []
      const ns = 'http://www.w3.org/2000/svg'

      // 각 소스 경로마다 위상이 어긋난 여러 파티클을 흘려보내 "데이터가 계속 들어오는" 흐름을 만든다
      sourcePaths.forEach((path) => {
        const length = path.getTotalLength()
        for (let i = 0; i < 3; i++) {
          const el = document.createElementNS(ns, 'circle')
          el.setAttribute('r', '4')
          particleGroup.value!.appendChild(el)
          particles.push({ el, path, length, phase: i / 3, speed: 0.14 })
        }
      })

      // 파이프를 통과해 나온 뒤에는 정돈된 시그널 색으로 출력 경로를 흐른다
      const outLength = outPath.value!.getTotalLength()
      for (let i = 0; i < 4; i++) {
        const el = document.createElementNS(ns, 'circle')
        el.setAttribute('r', '4')
        el.setAttribute('fill', 'var(--signal)')
        particleGroup.value!.appendChild(el)
        particles.push({ el, path: outPath.value!, length: outLength, phase: i / 4, speed: 0.22 })
      }

      tickerFn = () => {
        const t = gsap.ticker.time
        for (const p of particles) {
          const progress = (t * p.speed + p.phase) % 1
          const pt = p.path.getPointAtLength(progress * p.length)
          p.el.setAttribute('cx', pt.x.toString())
          p.el.setAttribute('cy', pt.y.toString())
          // 경로 끝에 가까워지면(파이프 진입 직전) 서서히 사라지듯 옅어진다
          p.el.setAttribute('opacity', progress > 0.92 ? ((1 - progress) / 0.08).toString() : '1')
        }
      }
      gsap.ticker.add(tickerFn)
    })
  }

  onBeforeUnmount(() => tween.kill())
})

onBeforeUnmount(() => {
  ctx?.revert()
  if (tickerFn) gsap.ticker.remove(tickerFn)
})
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 1.5rem 2rem;
  overflow: hidden;
}

.diagram {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pipe-node {
  animation: pulse 2.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { r: 42; opacity: 1; }
  50% { r: 46; opacity: 0.75; }
}

.copy {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 40rem;
}

.title {
  font-size: var(--text-hero);
}

.lede {
  color: var(--ink-muted);
}

@media (prefers-reduced-motion: reduce) {
  .pipe-node {
    animation: none;
  }
}
</style>
