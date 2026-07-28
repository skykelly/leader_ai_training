import { DEMO_CONFIG, defaultSection, type SectionType, type SiteConfig } from '~/types/site'

const STORAGE_KEY = 'scrollsite:config:v1'

// 싱글턴 — 빌더 페이지와 미리보기 페이지가 같은 config를 본다
let config: Ref<SiteConfig> | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined

function load(): SiteConfig {
  if (import.meta.server) return structuredClone(DEMO_CONFIG)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEMO_CONFIG)
    const parsed = JSON.parse(raw) as SiteConfig
    if (parsed?.version !== 1 || !Array.isArray(parsed.sections)) return structuredClone(DEMO_CONFIG)
    return parsed
  } catch {
    return structuredClone(DEMO_CONFIG)
  }
}

function persist(value: SiteConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* 저장 실패(사파리 프라이빗 모드 등)는 조용히 무시 — 편집 자체는 계속된다 */
  }
}

export function useSiteConfig() {
  if (!config) {
    config = ref(load())
    watch(
      config,
      (value) => {
        clearTimeout(saveTimer)
        saveTimer = setTimeout(() => persist(value), 400)
      },
      { deep: true },
    )
  }
  const cfg = config

  function addSection(type: SectionType) {
    cfg.value.sections.push(defaultSection(type))
  }

  function removeSection(id: string) {
    cfg.value.sections = cfg.value.sections.filter((s) => s.id !== id)
  }

  function moveSection(id: string, dir: 1 | -1) {
    const list = cfg.value.sections
    const i = list.findIndex((s) => s.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
  }

  function reset() {
    cfg.value = structuredClone(DEMO_CONFIG)
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(cfg.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cfg.value.title.replace(/\s+/g, '-').toLowerCase() || 'scrollsite'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importJson(file: File): Promise<boolean> {
    try {
      const parsed = JSON.parse(await file.text()) as SiteConfig
      if (parsed?.version !== 1 || !Array.isArray(parsed.sections)) return false
      cfg.value = parsed
      return true
    } catch {
      return false
    }
  }

  return { config: cfg, addSection, removeSection, moveSection, reset, exportJson, importJson }
}
