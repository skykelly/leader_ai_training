<template>
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
  aura.setPalette('faceBlue', 0.6)
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
  phase.value = 'result'
}

function restart() {
  scores.value = { visionary: 0, explorer: 0, catalyst: 0, guardian: 0 }
  step.value = 0
  result.value = null
  aura.setPalette('faceBlue')
  aura.setIntensity(1.1)
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
.experience {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 1.5rem;
}
</style>
