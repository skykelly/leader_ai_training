<template>
  <!-- 얼굴 파티클 뒤에 깔리는 보라 그라디언트. 원본도 배경이 검정이 아니라
       은은한 보라라서, 이게 없으면 얼굴만 검은 공간에 떠 보인다 -->
  <div class="aura-bg" aria-hidden="true">
    <!-- 원본 배경을 가로지르는 점선 타원 궤도 — 화면 밖까지 이어져 공간감을 준다 -->
    <svg class="orbit-rings" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
      <ellipse cx="500" cy="350" rx="486" ry="336" transform="rotate(-7 500 350)" />
      <ellipse cx="520" cy="336" rx="392" ry="288" transform="rotate(9 520 336)" />
      <ellipse cx="486" cy="360" rx="312" ry="352" transform="rotate(-16 486 360)" />
    </svg>
  </div>
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
    scale: 8.0 - t * 2.1 + max * 0.85,
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
  aura.setFacePersona({ scale: 9, noiseScale: 1.1, speed: 3 })
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
  /* 원본 영상 그리드 측정값 — 우측 상·중단이 가장 밝고(#29005e) 좌측은
     중간(#1a002f), 아래로 갈수록 검정(#000000)으로 떨어진다 */
  background:
    radial-gradient(78% 66% at 84% 26%, #46108c 0%, rgba(52, 4, 108, 0.82) 30%, rgba(33, 0, 74, 0.5) 56%, transparent 80%),
    radial-gradient(62% 52% at 12% 12%, rgba(38, 2, 72, 0.85) 0%, rgba(26, 0, 47, 0.45) 48%, transparent 78%),
    radial-gradient(120% 80% at 50% 4%, rgba(40, 4, 84, 0.55) 0%, transparent 62%),
    linear-gradient(180deg, rgba(30, 2, 62, 0.6) 0%, rgba(12, 0, 26, 0.3) 46%, #000000 84%),
    #000000;
}

.orbit-rings {
  position: absolute;
  inset: -6%;
  width: 112%;
  height: 112%;
  fill: none;
  stroke: rgba(196, 150, 255, 0.34);
  stroke-width: 1.1;
  stroke-dasharray: 1 13;
  stroke-linecap: round;
  opacity: 0.75;
}

/* 원본 배경에 흩뿌려진 미세한 점 — 크기가 다른 두 격자를 겹쳐 규칙성을 감춘다 */
.aura-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(214, 178, 255, 0.55) 0.6px, transparent 1.4px),
    radial-gradient(circle, rgba(180, 130, 255, 0.4) 0.5px, transparent 1.2px);
  background-size: 68px 68px, 113px 97px;
  background-position: 0 0, 31px 17px;
  /* 위쪽·오른쪽에서 진하고 아래로 사라지게 — 배경 그라디언트와 같은 흐름 */
  -webkit-mask-image: radial-gradient(96% 78% at 62% 22%, #000 0%, rgba(0, 0, 0, 0.45) 52%, transparent 82%);
  mask-image: radial-gradient(96% 78% at 62% 22%, #000 0%, rgba(0, 0, 0, 0.45) 52%, transparent 82%);
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
