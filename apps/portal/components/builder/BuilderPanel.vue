<template>
  <aside class="panel">
    <!-- 사이트 기본 -->
    <div class="group">
      <p class="g-label">사이트 제목</p>
      <input v-model="config.title" type="text" class="title-input" />
    </div>

    <!-- 테마 -->
    <div class="group">
      <p class="g-label">테마</p>
      <div class="presets">
        <button
          v-for="p in THEME_PRESETS"
          :key="p.name"
          class="preset"
          :title="p.name"
          type="button"
          :style="{ background: p.theme.bg }"
          @click="applyPreset(p.theme)"
        >
          <span :style="{ background: p.theme.accent }" />
          <span :style="{ background: p.theme.accent2 }" />
        </button>
      </div>
      <div class="colors">
        <label v-for="key in colorKeys" :key="key" class="color">
          <input v-model="config.theme[key]" type="color" />
          <span>{{ key }}</span>
        </label>
      </div>
    </div>

    <!-- 배경 -->
    <div class="group">
      <p class="g-label">배경 (WebGL)</p>
      <div class="bg-options">
        <label v-for="bg in backgrounds" :key="bg.kind" class="bg-option" :class="{ on: config.background === bg.kind }">
          <input v-model="config.background" type="radio" :value="bg.kind" name="background" />
          <span class="bg-name">{{ bg.kind }}</span>
          <span class="bg-desc">{{ bg.desc }}</span>
        </label>
      </div>
    </div>

    <!-- 섹션 -->
    <div class="group">
      <p class="g-label">섹션 ({{ config.sections.length }})</p>
      <div v-for="(section, i) in config.sections" :key="section.id" class="section-card">
        <div class="s-head">
          <button class="s-toggle" type="button" @click="toggle(section.id)">
            <span class="s-type">{{ SECTION_LABELS[section.type] }}</span>
            <span class="s-caret">{{ openId === section.id ? '▾' : '▸' }}</span>
          </button>
          <div class="s-actions">
            <button class="mini" type="button" title="위로" :disabled="i === 0" @click="moveSection(section.id, -1)">↑</button>
            <button class="mini" type="button" title="아래로" :disabled="i === config.sections.length - 1" @click="moveSection(section.id, 1)">↓</button>
            <button class="mini danger" type="button" title="삭제" @click="removeSection(section.id)">×</button>
          </div>
        </div>
        <SectionEditor v-if="openId === section.id" :section="section" />
      </div>
      <div class="add">
        <select v-model="addType" class="add-select">
          <option v-for="(label, type) in SECTION_LABELS" :key="type" :value="type">{{ label }}</option>
        </select>
        <button class="add-btn" type="button" @click="onAdd">+ 추가</button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { SECTION_LABELS, THEME_PRESETS, type SectionType, type SiteTheme } from '~/types/site'

const { config, addSection, removeSection, moveSection } = useSiteConfig()

const colorKeys = ['bg', 'ink', 'accent', 'accent2'] as const
const backgrounds = [
  { kind: 'none', desc: '배경 없음(그라디언트만)' },
  { kind: 'flow', desc: '흐름장 dot 필드 — 스크롤 속도에 가속' },
  { kind: 'warp', desc: '워프 스트릭 — 하이퍼스페이스 점프' },
  { kind: 'orbit', desc: '오빗 링 — 스크롤에 따라 궤도 정렬' },
] as const

const openId = ref<string | null>(null)
const addType = ref<SectionType>('feature')

function toggle(id: string) {
  openId.value = openId.value === id ? null : id
}

function applyPreset(theme: SiteTheme) {
  config.value.theme = { ...theme }
}

function onAdd() {
  addSection(addType.value)
  const added = config.value.sections[config.value.sections.length - 1]
  openId.value = added?.id ?? null
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 1.2rem;
  overflow-y: auto;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.g-label {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.title-input {
  font: inherit;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  padding: 0.5rem 0.7rem;
}

.presets {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.preset {
  width: 2.5rem;
  height: 1.8rem;
  border: 1px solid var(--line);
  border-radius: 0.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.preset:hover {
  border-color: var(--ink-faint);
}

.preset span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
}

.colors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

.color {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.68rem;
  color: var(--ink-faint);
}

.color input {
  width: 100%;
  height: 1.8rem;
  border: 1px solid var(--line);
  border-radius: 0.4rem;
  background: none;
  padding: 0.1rem;
  cursor: pointer;
}

.bg-options {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bg-option {
  display: grid;
  grid-template-columns: auto 3.4rem 1fr;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
}

.bg-option.on {
  border-color: var(--accent);
}

.bg-name {
  font-family: var(--font-display);
  font-size: 0.85rem;
}

.bg-desc {
  font-size: 0.72rem;
  color: var(--ink-faint);
}

.section-card {
  border: 1px solid var(--line);
  border-radius: 0.55rem;
  padding: 0.55rem 0.7rem;
}

.s-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.s-toggle {
  font: inherit;
  color: var(--ink);
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0;
}

.s-type {
  font-size: 0.85rem;
}

.s-caret {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.s-actions {
  display: flex;
  gap: 0.3rem;
}

.mini {
  font: inherit;
  font-size: 0.75rem;
  color: var(--ink-muted);
  background: none;
  border: 1px solid var(--line);
  border-radius: 0.35rem;
  width: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
}

.mini:disabled {
  opacity: 0.3;
  cursor: default;
}

.mini:not(:disabled):hover {
  color: var(--ink);
  border-color: var(--ink-faint);
}

.mini.danger:not(:disabled):hover {
  color: #ff7a7a;
  border-color: #ff7a7a;
}

.add {
  display: flex;
  gap: 0.45rem;
}

.add-select {
  font: inherit;
  font-size: 0.85rem;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  padding: 0.45rem 0.55rem;
  flex: 1;
}

.add-btn {
  font: inherit;
  font-size: 0.85rem;
  color: var(--bg);
  background: var(--accent);
  border: none;
  border-radius: 0.5rem;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
}
</style>
