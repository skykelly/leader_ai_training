<template>
  <div class="editor">
    <!-- hero -->
    <template v-if="section.type === 'hero'">
      <label class="f"><span>아이브로</span><input v-model="section.eyebrow" type="text" /></label>
      <label class="f"><span>타이틀 (줄바꿈 가능)</span><textarea v-model="section.title" rows="2" /></label>
      <label class="f"><span>태그라인</span><textarea v-model="section.tagline" rows="2" /></label>
    </template>

    <!-- feature -->
    <template v-else-if="section.type === 'feature'">
      <label class="f"><span>아이브로</span><input v-model="section.eyebrow" type="text" /></label>
      <label class="f"><span>타이틀</span><input v-model="section.title" type="text" /></label>
      <label class="f"><span>본문</span><textarea v-model="section.body" rows="3" /></label>
      <label class="check"><input v-model="section.reverse" type="checkbox" /><span>좌우 반전 (패널이 왼쪽)</span></label>
    </template>

    <!-- stats -->
    <template v-else-if="section.type === 'stats'">
      <label class="f"><span>타이틀</span><input v-model="section.title" type="text" /></label>
      <div v-for="(item, i) in section.items" :key="i" class="row">
        <input v-model="item.label" type="text" placeholder="라벨" class="grow" />
        <input v-model.number="item.value" type="number" step="0.1" class="num" />
        <input v-model="item.suffix" type="text" placeholder="+" class="suffix" />
        <button class="mini" type="button" title="삭제" @click="section.items.splice(i, 1)">×</button>
      </div>
      <button class="add-row" type="button" @click="section.items.push({ label: '항목', value: 100, suffix: '+' })">+ 항목 추가</button>
    </template>

    <!-- timeline -->
    <template v-else-if="section.type === 'timeline'">
      <label class="f"><span>타이틀</span><input v-model="section.title" type="text" /></label>
      <div v-for="(item, i) in section.items" :key="i" class="row">
        <input v-model="item.year" type="text" placeholder="연도" class="suffix" />
        <input v-model="item.text" type="text" placeholder="내용" class="grow" />
        <button class="mini" type="button" title="삭제" @click="section.items.splice(i, 1)">×</button>
      </div>
      <button class="add-row" type="button" @click="section.items.push({ year: '2027', text: '새 마일스톤' })">+ 항목 추가</button>
    </template>

    <!-- noise -->
    <template v-else-if="section.type === 'noise'">
      <label class="f"><span>아이브로</span><input v-model="section.eyebrow" type="text" /></label>
      <label class="f"><span>타이틀</span><input v-model="section.title" type="text" /></label>
      <label class="f"><span>본문</span><textarea v-model="section.body" rows="3" /></label>
    </template>

    <!-- cta -->
    <template v-else-if="section.type === 'cta'">
      <label class="f"><span>타이틀</span><input v-model="section.title" type="text" /></label>
      <label class="f"><span>본문</span><textarea v-model="section.body" rows="2" /></label>
      <label class="f"><span>버튼 텍스트</span><input v-model="section.button" type="text" /></label>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Section } from '~/types/site'

// config 안의 섹션 객체를 직접 v-model — useSiteConfig의 deep watch가 저장을 처리한다
defineProps<{ section: Section }>()
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding-top: 0.8rem;
}

.f {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.f span {
  font-size: var(--text-sm);
  color: var(--ink-faint);
}

input[type='text'],
input[type='number'],
textarea {
  font: inherit;
  font-size: 0.85rem;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 0.45rem;
  padding: 0.45rem 0.6rem;
  width: 100%;
  resize: vertical;
}

input:focus,
textarea:focus {
  outline: 1px solid var(--accent);
}

.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  cursor: pointer;
}

.row {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.grow {
  flex: 1;
  min-width: 0;
}

.num {
  width: 4.6rem;
}

.suffix {
  width: 3.6rem;
}

.mini {
  font: inherit;
  color: var(--ink-faint);
  background: none;
  border: 1px solid var(--line);
  border-radius: 0.4rem;
  width: 1.7rem;
  height: 1.7rem;
  cursor: pointer;
  flex-shrink: 0;
}

.mini:hover {
  color: var(--ink);
  border-color: var(--ink-faint);
}

.add-row {
  font: inherit;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  background: none;
  border: 1px dashed var(--line);
  border-radius: 0.45rem;
  padding: 0.4rem;
  cursor: pointer;
}

.add-row:hover {
  color: var(--ink);
}
</style>
