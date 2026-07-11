<template>
  <!--
    플랫/라인 일러스트 — waaark의 커스텀 일러스트 스타일을 단순 기하 도형으로 재현.
    .draw 요소는 pathLength="1" 트릭으로 stroke-dashoffset 드로우온 대상,
    .float 그룹은 둥실거리는 루프 모션 대상.
  -->
  <svg class="illu" viewBox="0 0 200 200" fill="none" :style="{ color: accent }">
    <g v-if="variant === 'horizon'">
      <circle class="draw" cx="100" cy="78" r="34" stroke="currentColor" stroke-width="3" pathLength="1" />
      <path class="draw" d="M30 132 L84 76 L118 112" stroke="var(--illu-ink)" stroke-width="3" stroke-linejoin="round" pathLength="1" />
      <g class="float">
        <path class="draw" d="M20 150 C 45 138, 70 162, 100 150 S 155 138, 180 150" stroke="var(--illu-ink)" stroke-width="3" stroke-linecap="round" pathLength="1" />
        <path class="draw" d="M35 168 C 60 158, 85 178, 115 168 S 160 158, 178 166" stroke="currentColor" stroke-width="3" stroke-linecap="round" pathLength="1" />
      </g>
    </g>

    <g v-else-if="variant === 'eye'">
      <path class="draw" d="M20 100 C 55 55, 145 55, 180 100 C 145 145, 55 145, 20 100 Z" stroke="var(--illu-ink)" stroke-width="3" pathLength="1" />
      <g class="float">
        <circle class="draw" cx="100" cy="100" r="26" stroke="currentColor" stroke-width="3" pathLength="1" />
        <circle cx="100" cy="100" r="9" fill="var(--illu-ink)" />
      </g>
      <path class="draw" d="M100 30 L100 46 M40 45 L52 58 M160 45 L148 58" stroke="currentColor" stroke-width="3" stroke-linecap="round" pathLength="1" />
    </g>

    <g v-else-if="variant === 'grid'">
      <g class="float">
        <rect class="draw" x="30" y="38" width="60" height="44" rx="6" stroke="var(--illu-ink)" stroke-width="3" pathLength="1" />
        <rect class="draw" x="110" y="38" width="60" height="44" rx="6" stroke="currentColor" stroke-width="3" pathLength="1" />
        <rect class="draw" x="30" y="104" width="60" height="44" rx="6" stroke="currentColor" stroke-width="3" pathLength="1" />
        <rect class="draw" x="110" y="104" width="60" height="44" rx="6" stroke="var(--illu-ink)" stroke-width="3" pathLength="1" />
      </g>
      <path class="draw" d="M46 170 C 80 160, 125 180, 158 168" stroke="var(--illu-ink)" stroke-width="3" stroke-linecap="round" pathLength="1" />
    </g>

    <g v-else-if="variant === 'duo'">
      <g class="float">
        <circle class="draw" cx="76" cy="94" r="40" stroke="var(--illu-ink)" stroke-width="3" pathLength="1" />
        <circle class="draw" cx="126" cy="94" r="40" stroke="currentColor" stroke-width="3" pathLength="1" />
      </g>
      <path class="draw" d="M62 96 Q 70 106 80 98 M118 96 Q 126 106 136 98" stroke="var(--illu-ink)" stroke-width="3" stroke-linecap="round" pathLength="1" />
      <path class="draw" d="M55 158 C 85 172, 118 172, 148 158" stroke="currentColor" stroke-width="3" stroke-linecap="round" pathLength="1" />
    </g>

    <g v-else>
      <g class="float">
        <path class="draw" d="M34 96 L166 56 L112 148 L94 112 Z" stroke="var(--illu-ink)" stroke-width="3" stroke-linejoin="round" pathLength="1" />
        <path class="draw" d="M94 112 L166 56" stroke="var(--illu-ink)" stroke-width="3" pathLength="1" />
      </g>
      <path class="draw" d="M28 152 C 50 144, 66 160, 88 152 M104 168 C 122 160, 138 172, 156 164" stroke="currentColor" stroke-width="3" stroke-linecap="round" pathLength="1" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { IllustrationVariant } from '~/data/slides'

defineProps<{ variant: IllustrationVariant; accent: string }>()
</script>

<style scoped>
.illu {
  width: min(60vw, 340px);
  height: auto;
}

/* pathLength=1 + dasharray 1 → dashoffset을 1→0으로 트윈하면 선이 그려진다 */
.illu :deep(.draw) {
  stroke-dasharray: 1;
}
</style>
