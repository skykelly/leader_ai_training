<template>
  <footer class="footer">
    <div class="container inner">
      <p class="display">Pioneer<span class="star">*</span></p>
      <p class="note">preparetopioneer.com의 스크롤리텔링 기법을 학습하기 위한 클론 프로젝트입니다.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
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

.star {
  color: var(--accent-a);
}

.note {
  color: var(--ink-faint);
  font-size: var(--text-sm);
}
</style>
