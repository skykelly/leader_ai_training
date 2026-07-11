<template>
  <section ref="rootEl" class="cta">
    <p class="eyebrow">The Experience</p>
    <h2 ref="titleEl" class="display title">What kind of pioneer are you?</h2>
    <p class="lede">다섯 개의 질문에 답하면, 당신의 파이오니어 유형과 아우라를 알려드립니다.</p>
    <MagneticButton to="/experience">Reveal my aura</MagneticButton>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const aura = useAura()
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })
    gsap.timeline({
      scrollTrigger: {
        trigger: rootEl.value,
        start: 'top 65%',
        onEnter: () => {
          tween.play()
          aura.setPalette('cta')
          aura.setIntensity(1.3)
        },
      },
    })
    return () => split.revert()
  }, rootEl.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<style scoped>
.cta {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.8rem;
  text-align: center;
  padding: 0 1.5rem;
}

.title {
  font-size: var(--text-xl);
  max-width: 16ch;
}

.lede {
  color: var(--ink-muted);
  max-width: 32rem;
}
</style>
