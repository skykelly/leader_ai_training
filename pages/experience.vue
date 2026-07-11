<template>
  <main class="experience">
    <p class="eyebrow">The Experience</p>
    <h1 class="display">What kind of<br />pioneer are you?</h1>
    <p class="lede">진단 플로우 — 곧 채워질 예정입니다.</p>
    <NuxtLink to="/">← 홈으로</NuxtLink>
  </main>
</template>

<style scoped>
.experience {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
  padding: 0 1.5rem;
}

.experience h1 {
  font-size: var(--text-xl);
}

.lede {
  color: var(--ink-muted);
}
</style>
