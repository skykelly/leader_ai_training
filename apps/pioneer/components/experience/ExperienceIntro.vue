<template>
  <div class="intro" :class="{ typing }">
    <p class="eyebrow">The Experience</p>
    <!-- 타이틀이 다 찍히면 리드문이 이어서 찍힌다. 그동안 얼굴 파티클은 계속
         진동한다 — useFaceType이 활성 문단 수를 세어 문단 사이에서 안 끊긴다 -->
    <TypedText
      ref="titleRef"
      tag="h1"
      class="display title"
      :text="TITLE"
      :delay="420"
      caret
      @done="ledeStarted = true"
    />
    <TypedText class="lede" :text="LEDE" :start="ledeStarted" :delay="260" @done="typing = false" />

    <div class="actions">
      <MagneticButton @click="$emit('start')">Begin</MagneticButton>
      <button class="replay" type="button" @click="replay">
        <span class="dot" :class="{ on: typing }" />
        Replay
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ start: [] }>()

const TITLE = 'What kind of pioneer are you?'
const LEDE = '다섯 개의 질문이 당신의 아우라를 읽습니다.\n생각나는 대로, 솔직하게 답해 주세요.'

const titleRef = ref<{ replay: () => void } | null>(null)
const ledeStarted = ref(false)
const typing = ref(true)

function replay() {
  // 리드문 대기 상태로 되돌린 뒤 타이틀부터 다시 찍는다
  ledeStarted.value = false
  typing.value = true
  titleRef.value?.replay()
}
</script>

<style scoped>
.intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.8rem;
  text-align: center;
}

.title {
  font-size: var(--text-xl);
  /* 글자 단위로 접히던 SplitText가 빠지면서 단어 단위로 접힌다 —
     원래의 세 줄 구성이 유지되도록 폭을 좁혀 잡았다 */
  max-width: 12ch;
  transition: text-shadow 0.4s ease;
}

.intro.typing .title {
  text-shadow: 0 0 22px rgba(196, 150, 255, 0.55);
}

.lede {
  color: var(--ink-muted);
  /* 줄바꿈을 \n으로 넣어 타이핑이 문장 순서 그대로 흐르게 한다 */
  white-space: pre-line;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.replay {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font: inherit;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-faint);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.25s ease;
}

.replay:hover {
  color: var(--ink);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid currentColor;
  transition:
    background-color 0.25s ease,
    box-shadow 0.25s ease;
}

.dot.on {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  .intro.typing .title {
    text-shadow: none;
  }
}
</style>
