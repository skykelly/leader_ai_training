<template>
  <!-- 화면 오른쪽에 고정. `.experience`(화면 전체를 덮는 클릭 진행 레이어)의
       자식이 아니라 형제로 두는 게 중요하다 — 자식이면 스와치 클릭이 위로
       버블링되어 색을 고를 때마다 문장이 넘어간다 -->
  <div class="picker" role="radiogroup" :aria-label="'점 색상'">
    <span class="cap eyebrow" aria-hidden="true">색</span>

    <button
      v-for="preset in PRESETS"
      :key="preset.hex"
      class="swatch"
      role="radio"
      :aria-checked="isActive(preset.hex)"
      :aria-label="preset.label"
      :title="preset.label"
      :class="{ on: isActive(preset.hex) }"
      :style="{ '--c': preset.hex }"
      @click="pick(preset.hex)"
    />

    <!-- 직접 고르기. 네이티브 색상 입력을 스와치 모양으로 덮어씌운다 -->
    <label class="swatch custom" :class="{ on: isCustom }" :style="{ '--c': custom }" title="직접 고르기">
      <span class="sr-only">직접 고르기</span>
      <input v-model="custom" type="color" @input="pick(custom)" />
    </label>
  </div>
</template>

<script setup lang="ts">
/**
 * 얼굴 파티클 색 선택기.
 * 고른 색에서 하이라이트·파문색이 파생되므로(FaceParticles.setColor)
 * 여기서는 바탕색 하나만 넘긴다.
 */
const PRESETS = [
  { hex: '#8302af', label: '보라 (기본)' },
  { hex: '#2563eb', label: '블루' },
  { hex: '#0ea5e9', label: '시안' },
  { hex: '#10b981', label: '그린' },
  { hex: '#f59e0b', label: '앰버' },
  { hex: '#e11d48', label: '로즈' },
]

const aura = useAura()
const selected = ref(PRESETS[0]!.hex)
const custom = ref('#7dd3fc')

const isActive = (hex: string) => selected.value.toLowerCase() === hex.toLowerCase()
const isCustom = computed(() => !PRESETS.some((p) => isActive(p.hex)))

function pick(hex: string) {
  selected.value = hex
  // reduced-motion이면 색이 서서히 번지는 연출을 생략하고 즉시 바꾼다
  const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  aura.setFaceColor(hex, instant ? 0 : 0.6)
}
</script>

<style scoped>
.picker {
  position: fixed;
  right: clamp(0.6rem, 1.8vw, 1.4rem);
  top: 50%;
  transform: translateY(-50%);
  z-index: 3; /* .experience(1) 위 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 0.5rem;
  border: 1px solid rgba(196, 150, 255, 0.18);
  border-radius: 999px;
  background: rgba(10, 0, 24, 0.42);
  backdrop-filter: blur(8px);
}

.cap {
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  color: var(--ink-faint);
  margin-bottom: 0.1rem;
}

.swatch {
  position: relative;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--c);
  cursor: pointer;
  /* 어두운 색도 배경에서 떠 보이게 얇은 테두리를 깐다 */
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.swatch:hover {
  transform: scale(1.14);
}

.swatch.on {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.3),
    0 0 0 2px var(--bg, #05000d),
    0 0 0 3.5px var(--c);
}

.swatch:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

/* 직접 고르기: 무지개 링으로 "임의의 색"임을 알린다 */
.custom {
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    linear-gradient(var(--c), var(--c)) padding-box,
    conic-gradient(#f87171, #fbbf24, #34d399, #38bdf8, #a78bfa, #f87171) border-box;
  border: 3px solid transparent;
}

/* 네이티브 색상 입력은 브라우저마다 생김새가 달라 통째로 감춘다 */
.custom input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .swatch {
    transition: none;
  }
  .swatch:hover {
    transform: none;
  }
}
</style>
