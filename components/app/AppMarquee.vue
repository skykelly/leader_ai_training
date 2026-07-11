<template>
  <div ref="rootEl" class="marquee" aria-hidden="true">
    <div class="track">
      <span v-for="i in 4" :key="i" class="display chunk">{{ text }}&nbsp;·&nbsp;</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

defineProps<{ text: string }>()

const rootEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    // 동일 텍스트 4개를 이어붙이고 -25%(한 조각 폭)만큼 무한 이동 → 이음새 없는 루프
    gsap.to('.track', { xPercent: -25, duration: 12, ease: 'none', repeat: -1 })
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.marquee {
  overflow: hidden;
  padding: 3.5rem 0;
  border-block: 1px solid var(--line);
  white-space: nowrap;
}

.track {
  display: inline-flex;
  will-change: transform;
}

.chunk {
  font-size: var(--text-xl);
  color: transparent;
  -webkit-text-stroke: 1px var(--ink-faint);
}
</style>
