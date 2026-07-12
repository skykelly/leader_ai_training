<template>
  <footer class="footer">
    <div class="container inner">
      <p class="display">AEOLIA<span class="dot">.</span></p>
      <p class="note">Virya Energy 풍력 에너지 웹사이트의 클립패스 리빌·SVG 일러스트 기법을 학습하기 위한 클론입니다.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--line);
  padding: 2.5rem 0;
  background: var(--bg);
}

.inner {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}

.dot {
  color: var(--amber);
}

.note {
  color: var(--ink-faint);
  font-size: var(--text-sm);
}
</style>
