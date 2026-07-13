<template>
  <footer class="footer">
    <div class="container inner">
      <p class="display">NEXUS<span class="dot">.</span></p>
      <p class="note">Dayos(Times Two Design)의 3D 오빗 링 스크롤 연출 기법을 학습하기 위한 클론입니다.</p>
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
  color: var(--core);
}

.note {
  color: var(--ink-faint);
  font-size: var(--text-sm);
}
</style>
