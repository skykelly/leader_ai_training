<template>
  <main>
    <section class="hero">
      <p class="eyebrow">Scrollytelling study</p>
      <h1 class="display">Prepare<br />to Pioneer</h1>
      <p class="lede">스크롤리텔링 학습 프로젝트 — 곧 채워질 예정입니다.</p>
      <NuxtLink to="/experience">경험 시작하기 →</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
  padding: 0 1.5rem;
}

.hero h1 {
  font-size: var(--text-hero);
}

.lede {
  color: var(--ink-muted);
  max-width: 32rem;
}
</style>
