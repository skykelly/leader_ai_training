<template>
  <div class="builder">
    <header class="bar">
      <NuxtLink to="/" class="logo display">Scroll Study<span class="star">*</span> <span class="mode">Builder</span></NuxtLink>
      <div class="actions">
        <button class="act" type="button" @click="openPreview">전체 미리보기 ↗</button>
        <button class="act" type="button" @click="exportJson">JSON 내보내기</button>
        <button class="act" type="button" @click="fileEl?.click()">가져오기</button>
        <button class="act danger" type="button" @click="onReset">초기화</button>
        <input ref="fileEl" type="file" accept="application/json" class="file" @change="onImport" />
      </div>
    </header>

    <div class="body">
      <BuilderPanel class="left" />
      <div class="right">
        <SitePreview :config="config" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Site Builder — Scroll Study Library' })

const { config, reset, exportJson, importJson } = useSiteConfig()
const fileEl = ref<HTMLInputElement | null>(null)

function openPreview() {
  // SPA base path를 존중해 새 탭으로 풀스크린 미리보기를 연다
  const router = useRouter()
  window.open(router.resolve('/preview').href, '_blank')
}

function onReset() {
  if (confirm('편집 내용을 버리고 데모 구성으로 되돌릴까요?')) reset()
}

async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ok = await importJson(file)
  if (!ok) alert('올바른 사이트 JSON 파일이 아닙니다.')
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<style scoped>
.builder {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.logo {
  font-size: 1rem;
}

.star {
  color: var(--accent);
}

.mode {
  color: var(--ink-faint);
  font-weight: 400;
  margin-left: 0.35rem;
}

.actions {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.act {
  font: inherit;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  background: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  white-space: nowrap;
}

.act:hover {
  color: var(--ink);
  border-color: var(--ink-faint);
}

.act.danger:hover {
  color: #ff7a7a;
  border-color: #ff7a7a;
}

.file {
  display: none;
}

.body {
  flex: 1;
  display: grid;
  grid-template-columns: 21rem 1fr;
  min-height: 0;
}

.left {
  border-right: 1px solid var(--line);
  min-height: 0;
}

.right {
  min-height: 0;
  min-width: 0;
}

/* 모바일: 패널이 위, 프리뷰가 아래로 쌓인다 */
@media (max-width: 860px) {
  .builder {
    height: auto;
    min-height: 100vh;
  }

  .body {
    grid-template-columns: 1fr;
  }

  .left {
    border-right: none;
    border-bottom: 1px solid var(--line);
    max-height: 45vh;
  }

  .right {
    height: 80vh;
  }
}
</style>
