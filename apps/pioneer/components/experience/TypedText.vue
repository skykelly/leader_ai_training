<template>
  <!-- 완성된 문장을 visibility:hidden으로 깔아 자리를 먼저 잡는다.
       없으면 줄 수가 늘어날 때마다 아래 내용이 밀려 레이아웃이 출렁인다 -->
  <component :is="tag" class="typed-text" :class="{ 'is-typing': typing }" :aria-label="text">
    <span class="tt-ghost" aria-hidden="true">{{ text }}</span>
    <span class="tt-live" aria-hidden="true">{{ shown }}<i v-if="caret" class="tt-caret" /></span>
  </component>
</template>

<script setup lang="ts">
/**
 * 한 글자씩 찍히면서 얼굴 파티클을 같은 리듬으로 진동시키는 텍스트.
 * 진단 플로우의 모든 메인 문장이 이 컴포넌트를 쓴다.
 */
const props = withDefaults(
  defineProps<{
    text: string
    tag?: string
    /** false면 대기 — 앞 문장이 끝난 뒤 이어서 찍을 때 쓴다 */
    start?: boolean
    /** 시작 전 지연(ms) */
    delay?: number
    /** 글자당 밀리초 */
    charDelay?: number
    caret?: boolean
  }>(),
  { tag: 'p', start: true, delay: 0, charDelay: 82, caret: false },
)

const emit = defineEmits<{ done: [] }>()

const { text: shown, typing, type, stop } = useFaceType()
let timer: ReturnType<typeof setTimeout> | undefined

function run() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    type(props.text, { charDelay: props.charDelay, onEnd: () => emit('done') })
  }, props.delay)
}

/** 부모가 다시 재생시킬 때 쓴다 */
defineExpose({ replay: run })

watch(
  () => props.start,
  (on) => {
    if (on) run()
  },
  { immediate: true },
)

// 문장 자체가 바뀌면(다음 질문으로 넘어감) 처음부터 다시 찍는다
watch(() => props.text, run)

onBeforeUnmount(() => {
  clearTimeout(timer)
  stop()
})
</script>

<style scoped>
.typed-text {
  position: relative;
}

.tt-ghost {
  display: block;
  visibility: hidden;
}

.tt-live {
  position: absolute;
  inset: 0;
}

.tt-caret {
  display: inline-block;
  width: 0.06em;
  height: 0.78em;
  margin-left: 0.06em;
  vertical-align: -0.06em;
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
}

.typed-text:not(.is-typing) .tt-caret {
  animation: tt-caret-blink 1.1s steps(1) infinite;
}

@keyframes tt-caret-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tt-caret {
    display: none;
  }
}
</style>
