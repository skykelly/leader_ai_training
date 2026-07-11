<template>
  <div class="intro">
    <p class="eyebrow">The Experience</p>
    <h1 ref="titleEl" class="display title">What kind of pioneer are you?</h1>
    <p class="lede">
      다섯 개의 질문이 당신의 아우라를 읽습니다.<br />
      생각나는 대로, 솔직하게 답해 주세요.
    </p>
    <MagneticButton @click="$emit('start')">Begin</MagneticButton>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ start: [] }>()

const titleEl = ref<HTMLElement | null>(null)

onMounted(() => {
  splitRevealTween(titleEl.value!)
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
}

.lede {
  color: var(--ink-muted);
}
</style>
