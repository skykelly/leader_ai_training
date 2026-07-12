<template>
  <footer class="footer">
    <div class="container inner">
      <p class="display">CONDUIT<span class="dot">.</span></p>
      <p class="note">Monad(보안 데이터 파이프라인 플랫폼)의 컨셉을 바탕으로 스크롤 파이프라인 다이어그램 기법을 학습하기 위한 클론입니다.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--line);
  padding: 2.5rem 0;
}

.inner {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}

.dot {
  color: var(--signal);
}

.note {
  color: var(--ink-faint);
  font-size: var(--text-sm);
}
</style>
