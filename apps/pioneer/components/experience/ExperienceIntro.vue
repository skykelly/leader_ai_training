<template>
  <!-- 타이핑 강조 클래스는 글자 노드를 계속 갈아끼우는 h1이 아니라 부모에 건다 -->
  <div class="intro" :class="{ typing }">
    <p class="eyebrow">The Experience</p>
    <!-- 문장이 한 글자씩 찍히는 동안 얼굴 파티클이 같은 리듬으로 진동한다.
         높이를 미리 잡아두지 않으면 줄이 늘어날 때 아래 내용이 밀린다 -->
    <h1 class="display title" :aria-label="TITLE">
      <span class="ghost" aria-hidden="true">{{ TITLE }}</span>
      <span class="typed" aria-hidden="true">{{ typed }}<i class="caret" /></span>
    </h1>
    <p class="lede">
      다섯 개의 질문이 당신의 아우라를 읽습니다.<br />
      생각나는 대로, 솔직하게 답해 주세요.
    </p>

    <div class="actions">
      <MagneticButton @click="$emit('start')">Begin</MagneticButton>
      <button class="replay" type="button" @click="runTitle">
        <span class="dot" :class="{ on: typing }" />
        Replay
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ start: [] }>()

const TITLE = 'What kind of pioneer are you?'

const aura = useAura()
const { text: typed, typing, type, stop } = useTypewriter()

function runTitle() {
  type(TITLE, {
    onStart: () => aura.setFaceTyping(true),
    // 글자마다 진폭이 튄다 — 문장이 찍히는 속도가 그대로 진동 리듬이 된다.
    // 공백에서는 건너뛰어 단어 단위의 호흡이 살아난다
    onChar: (_i, ch) => {
      if (ch !== ' ') aura.faceTypePulse()
    },
    onEnd: () => aura.setFaceTyping(false),
  })
}

onMounted(() => {
  // 인트로가 들어오는 트랜지션이 끝난 뒤 찍히기 시작한다
  const t = setTimeout(runTitle, 420)
  onBeforeUnmount(() => clearTimeout(t))
})

onBeforeUnmount(() => {
  stop()
  aura.setFaceTyping(false)
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
  position: relative;
  font-size: var(--text-xl);
  /* SplitText가 글자 단위 박스를 만들 때는 16ch에서 세 줄로 접혔다.
     평문으로 바뀌면 단어 단위로 접혀 두 줄이 되므로 폭을 직접 좁혀 맞춘다 */
  max-width: 12ch;
  transition: text-shadow 0.4s ease;
}

/* 완성된 문장을 투명하게 깔아 자리를 잡아둔다 — 없으면 줄 수가 늘 때마다
   아래 내용이 밀려 레이아웃이 출렁인다 */
.ghost {
  display: block;
  visibility: hidden;
}

.typed {
  position: absolute;
  inset: 0;
}

.caret {
  display: inline-block;
  width: 0.06em;
  height: 0.78em;
  margin-left: 0.06em;
  vertical-align: -0.06em;
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
}

.intro.typing .caret {
  opacity: 1;
}

.intro:not(.typing) .caret {
  animation: caret-blink 1.1s steps(1) infinite;
}

@keyframes caret-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

.intro.typing .title {
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

  .caret {
    display: none;
  }
}
</style>
