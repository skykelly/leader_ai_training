<template>
  <footer class="footer">
    <div class="container inner">
      <p class="display">COGENT<span class="dot">.</span></p>
      <p class="note">Lusion(Devin AI 웹사이트 제작사)의 실시간 3D 셰이더 기법을 학습하기 위한 클론입니다.</p>
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
