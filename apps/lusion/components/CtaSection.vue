<template>
  <section ref="rootEl" class="cta">
    <p class="eyebrow">Get started</p>
    <h2 ref="titleEl" class="display title">Give it a task.<br />Watch it ship.</h2>
    <MagneticButton>Try COGENT →</MagneticButton>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const core = useCore()
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })
    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 65%',
      onEnter: () => {
        tween.play()
        core.setPalette('cta')
        core.setGlow(1.4)
        core.setScale(1.3)
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
}
</style>
