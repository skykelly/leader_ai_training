<template>
  <main>
    <div id="morph-track">
      <HeroReveal />
      <StoryPanel />
    </div>
    <FeatureSection v-for="(feature, i) in features" :key="feature.eyebrow" :feature="feature" :index="i" />
    <CtaSection />
    <AppFooter />
  </main>
</template>

<script setup lang="ts">
import { features } from '~/data/sections'
</script>
