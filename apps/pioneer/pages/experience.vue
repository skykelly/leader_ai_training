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

  <!-- 화면 어디를 눌러도 다음 문장으로 넘어간다. 캔버스 위 전면을 덮는
       레이어라 얼굴 위든 여백이든 반응한다 -->
  <main
    class="experience"
    role="button"
    tabindex="0"
    :aria-label="`${index + 1} / ${LINES.length} — 눌러서 다음 문장`"
    @click="advance"
    @keydown.enter.prevent="advance"
    @keydown.space.prevent="advance"
  >
    <!-- 얼굴 아래 자막. text가 바뀌면 TypedText가 스스로 다시 찍는다 -->
    <TypedText
      ref="lineRef"
      class="line display"
      :text="LINES[index]"
      :delay="index === 0 ? 500 : 120"
      caret
      @done="settled = true"
    />

    <p class="hint eyebrow" :class="{ show: settled }">
      {{ index === LINES.length - 1 ? 'Click to start over' : 'Click anywhere to continue' }}
    </p>
  </main>

  <!-- main 밖에 둔다 — 안에 있으면 스와치 클릭이 advance로 버블링된다.
       (컴포넌트 자동 임포트가 pathPrefix: false라 디렉터리 접두사가 없다) -->
  <ColorPicker />
</template>

<script setup lang="ts">
/**
 * 얼굴이 스스로를 소개하는 내러티브. 진단(질문·선택지)을 걷어내고
 * 문장 하나씩 화면 아래에 찍는 구성으로 바꿨다.
 *
 * 클릭 규칙: 찍히는 중이면 그 문장을 즉시 완성하고, 이미 완성됐으면 다음
 * 문장으로 넘어간다. 찍히는 도중의 클릭을 그대로 "다음"으로 처리하면
 * 읽기도 전에 문장이 사라진다.
 */
const LINES = [
  'What kind of pioneer are you?',
  'I am an AI that is curious about people.',
  'I ask questions to understand how people think and feel.',
  'Every conversation helps me learn something new.',
  'I discover that every person has a unique story.',
  'The more I learn, the better I can help people.',
  'That is why I keep exploring the amazing world of humans.',
]

const aura = useAura()
const index = ref(0)
const settled = ref(false)
const lineRef = ref<{ replay: () => void; finish: () => void } | null>(null)

function advance() {
  if (!settled.value) {
    // 아직 찍히는 중 — 마저 다 보여준다
    lineRef.value?.finish()
    return
  }
  settled.value = false
  // 마지막 문장에서 다시 누르면 처음으로 돌아간다(막다른 곳을 만들지 않는다)
  const nextIndex = (index.value + 1) % LINES.length
  if (nextIndex === index.value) lineRef.value?.replay()
  index.value = nextIndex
}

watch(index, () => {
  settled.value = false
})

onMounted(() => {
  aura.setMode('face')
  aura.setPalette('faceAura', 0.6)
  aura.setIntensity(1.1)
})
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

/* 얼굴은 화면 위쪽에 뜨고 자막은 그 아래에 깔린다.
   전면을 덮어야 "화면 어디든 클릭"이 성립하므로 여백까지 이 레이어가 받는다 */
.experience {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 1.1rem;
  padding: 0 1.5rem 8vh;
  text-align: center;
  cursor: pointer;
}

.line {
  /* 자막이라 히어로 타이틀보다 작다. 폭을 잡아 두 줄을 넘지 않게 한다 */
  font-size: clamp(1.05rem, 2.6vw, 1.9rem);
  line-height: 1.45;
  max-width: 32ch;
  text-wrap: balance;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.55);
}

.hint {
  color: var(--ink-faint);
  opacity: 0;
  transition: opacity 0.6s ease;
}

.hint.show {
  opacity: 0.75;
}

@media (max-width: 600px) {
  .experience {
    padding-bottom: 6vh;
  }
}
</style>
