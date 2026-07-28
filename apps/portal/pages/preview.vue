<template>
  <div class="full">
    <SitePreview :config="config" />
    <NuxtLink to="/builder" class="back">← Builder</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { config } = useSiteConfig()
useHead({ title: () => `${config.value.title} — Preview` })
</script>

<style scoped>
.full {
  position: fixed;
  inset: 0;
}

.back {
  position: fixed;
  top: 1rem;
  left: 1.2rem;
  z-index: 20;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.14em;
  color: var(--ink-faint);
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
}

.back:hover {
  color: var(--ink);
}
</style>
