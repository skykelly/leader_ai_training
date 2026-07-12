<template>
  <main>
    <HeroSection />
    <CapabilitySection v-for="(cap, i) in capabilities" :key="cap.eyebrow" :cap="cap" :index="i" />
    <CtaSection />
    <AppFooter />
  </main>
</template>

<script setup lang="ts">
import { capabilities } from '~/data/sections'
</script>
