<template>
  <!-- SplitText가 h1의 DOM을 글자 단위로 재구성하므로, 발화 강조 클래스는
       SplitText가 건드리지 않는 부모에 건다 -->
  <div class="intro" :class="{ speaking }">
    <p class="eyebrow">The Experience</p>
    <h1 ref="titleEl" class="display title">{{ TITLE }}</h1>
    <p class="lede">
      다섯 개의 질문이 당신의 아우라를 읽습니다.<br />
      생각나는 대로, 솔직하게 답해 주세요.
    </p>

    <div class="actions">
      <MagneticButton @click="$emit('start')">Begin</MagneticButton>
      <button class="sound" type="button" :aria-pressed="soundOn" @click="toggleSound">
        <span class="dot" :class="{ on: soundOn }" />
        Sound {{ soundOn ? 'on' : 'off' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ start: [] }>()

const TITLE = 'What kind of pioneer are you?'

const titleEl = ref<HTMLElement | null>(null)
const soundOn = ref(false)
const speaking = ref(false)

const aura = useAura()
const speech = useSpeech()

function speakTitle() {
  speaking.value = true
  aura.setFaceSpeaking(true)
  speech.speak(TITLE, {
    // 단어 경계마다 파티클 진폭이 튀어 말의 리듬이 얼굴에 실린다
    onWord: () => aura.faceSpeechPulse(),
    onEnd: () => {
      speaking.value = false
      aura.setFaceSpeaking(false)
    },
  })
}

function toggleSound() {
  soundOn.value = !soundOn.value
  if (soundOn.value) {
    // 음성 목록은 비동기로 채워지므로 첫 발화 전에 워밍업한다
    speech.warmUp()
    speakTitle()
  } else {
    speech.cancel()
    speaking.value = false
    aura.setFaceSpeaking(false)
  }
}

onMounted(() => {
  splitRevealTween(titleEl.value!)
})

onBeforeUnmount(() => {
  speech.cancel()
  aura.setFaceSpeaking(false)
})
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
  max-width: 16ch;
  transition: text-shadow 0.4s ease;
}

.intro.speaking .title {
  text-shadow: 0 0 22px rgba(196, 150, 255, 0.55);
}

.lede {
  color: var(--ink-muted);
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.sound {
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

.sound:hover {
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
  .intro.speaking .title {
    text-shadow: none;
  }
}
</style>
