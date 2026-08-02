<template>
  <div class="step">
    <p class="eyebrow">{{ String(index + 1).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }} — {{ question.promptEn }}</p>
    <TypedText tag="h2" class="display prompt" :text="question.prompt" :delay="180" caret />
    <ul class="choices">
      <li v-for="(c, i) in question.choices" :key="i">
        <button class="choice" @click="$emit('answer', c)">
          <span class="choice-index eyebrow">{{ 'ABCD'[i] }}</span>
          <span>{{ c.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import type { Question, Choice } from '~/data/questions'

const props = defineProps<{ question: Question; index: number; total: number }>()
defineEmits<{ answer: [choice: Choice] }>()

// 질문 문장은 TypedText가 한 글자씩 찍으면서 얼굴 파티클을 진동시킨다
// (질문이 바뀌면 text prop 변경을 감지해 스스로 다시 찍는다)
onMounted(() => {
  gsap.from('.choice', {
    autoAlpha: 0,
    y: 30,
    duration: 0.7,
    ease: 'power3.out',
    stagger: 0.08,
    delay: 0.25,
  })
})

// 같은 컴포넌트가 재사용되므로 질문이 바뀔 때도 리빌을 다시 재생
watch(
  () => props.index,
  async () => {
    await nextTick()
    gsap.fromTo(
      '.choice',
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.2 },
    )
  },
)
</script>

<style scoped>
.step {
  display: flex;
  flex-direction: column;
  gap: 2.2rem;
  width: min(100%, 46rem);
}

.prompt {
  font-size: var(--text-lg);
  text-transform: none;
  letter-spacing: -0.02em;
}

.choices {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.choice {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  text-align: left;
  padding: 1.1rem 1.4rem;
  border: 1px solid var(--line);
  border-radius: 0.8rem;
  color: var(--ink);
  transition: border-color 0.3s var(--ease-out), background-color 0.3s var(--ease-out);
}

.choice:hover {
  border-color: var(--ink);
  background: rgba(244, 241, 255, 0.05);
}

.choice-index {
  color: var(--ink-faint);
}
</style>
