<template>
  <section ref="rootEl" class="cta">
    <p class="eyebrow">Get started</p>
    <h2 ref="titleEl" class="display title">Ready to move<br />at light speed?</h2>
    <MagneticButton>Start a transfer →</MagneticButton>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const rootEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const warp = useWarp()
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    const { split, tween } = splitRevealTween(titleEl.value!, { paused: true })
    ScrollTrigger.create({
      trigger: rootEl.value,
      start: 'top 65%',
      onEnter: () => {
        tween.play()
        warp.pulse()
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
  text-transform: uppercase;
}
</style>
