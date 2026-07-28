<template>
  <!-- 얼굴 파티클 뒤에 깔리는 보라 그라디언트. 원본도 배경이 검정이 아니라
       은은한 보라라서, 이게 없으면 얼굴만 검은 공간에 떠 보인다 -->
  <div class="aura-bg" aria-hidden="true" />
  <main class="experience">
    <Transition :css="false" mode="out-in" @enter="onEnter" @leave="onLeave">
      <ExperienceIntro v-if="phase === 'intro'" key="intro" @start="start" />
      <QuestionStep
        v-else-if="phase === 'question'"
        key="question"
        :question="questions[step]"
        :index="step"
        :total="questions.length"
        @answer="answer"
      />
      <ResultScreen v-else key="result" :persona="result!" @restart="restart" />
    </Transition>
  </main>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { questions, type Choice } from '~/data/questions'
import { personas, type Persona, type PersonaId } from '~/data/personas'

type Phase = 'intro' | 'question' | 'result'

const phase = ref<Phase>('intro')
const step = ref(0)
const scores = ref<Record<PersonaId, number>>({ visionary: 0, explorer: 0, catalyst: 0, guardian: 0 })
const result = ref<Persona | null>(null)
const aura = useAura()

onMounted(() => {
  aura.setMode('face')
  aura.setPalette('faceAura', 0.6)
  aura.setIntensity(1.1)
})

function start() {
  phase.value = 'question'
}

function answer(choice: Choice) {
  // 점수 누적 + 이번 선택이 가장 강하게 가리키는 유형 쪽으로 아우라 모핑
  let dominant: PersonaId | null = null
  let max = 0
  for (const [id, w] of Object.entries(choice.weights) as [PersonaId, number][]) {
    scores.value[id] += w
    if (w > max) {
      max = w
      dominant = id
    }
  }
  if (dominant) aura.setPalette(personas[dominant].palette, 1)
  aura.pulse()
  // 원본처럼 답변이 얼굴 파티클의 생김새 자체를 바꾼다 — 질문이 진행될수록
  // 파티클이 잘게 흩어지거나(디테일) 크고 느리게(구름) 변한다
  const t = (step.value + 1) / questions.length
  aura.setFacePersona({
    scale: 20 - t * 5 + max * 2,
    noiseScale: 0.34 + t * 0.3,
    speed: 3.4 - t * 1.1,
  })

  if (step.value < questions.length - 1) {
    step.value += 1
  } else {
    finish()
  }
}

function finish() {
  const winner = (Object.entries(scores.value) as [PersonaId, number][]).sort((a, b) => b[1] - a[1])[0][0]
  result.value = personas[winner]
  aura.setPalette(personas[winner].palette, 2)
  aura.setIntensity(1.5, 2)
  // 결과 공개 순간 얼굴이 한 번 흩어졌다 다시 모인다
  aura.faceExplode()
  phase.value = 'result'
}

function restart() {
  scores.value = { visionary: 0, explorer: 0, catalyst: 0, guardian: 0 }
  step.value = 0
  result.value = null
  aura.setPalette('faceAura')
  aura.setIntensity(1.1)
  aura.setFacePersona({ scale: 18.5, noiseScale: 0.4, speed: 3 })
  phase.value = 'intro'
}

// 스텝 간 전환: GSAP JS 훅으로 페이드+슬라이드
function onEnter(el: Element, done: () => void) {
  gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', onComplete: done })
}

function onLeave(el: Element, done: () => void) {
  gsap.to(el, { autoAlpha: 0, y: -30, duration: 0.4, ease: 'power2.in', onComplete: done })
}
</script>

<style scoped>
.aura-bg {
  position: fixed;
  inset: 0;
  z-index: -1; /* 캔버스(0)보다 뒤 — 투명한 캔버스를 통해 비쳐 보인다 */
  pointer-events: none;
  /* 원본 영상 측정값: 좌상 #1a0031 · 우상 #1b003e · 좌하/우하 #000000.
     위쪽에만 보라가 있고 아래로 갈수록 검정으로 떨어진다 */
  background:
    radial-gradient(64% 46% at 16% 6%, #2c0658 0%, rgba(26, 0, 49, 0.5) 44%, transparent 74%),
    radial-gradient(56% 40% at 90% 14%, rgba(30, 0, 70, 0.68) 0%, transparent 72%),
    linear-gradient(180deg, rgba(24, 2, 48, 0.5) 0%, rgba(10, 0, 20, 0.25) 45%, #000000 82%),
    #000000;
}

.experience {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 1.5rem;
}
</style>
