/**
 * 사이트 빌더 데이터 모델.
 * 모든 클론과 같은 구조 — 전역 WebGL 배경 1개 + 스크롤되는 섹션들 — 를
 * 하나의 직렬화 가능한 config로 표현한다. localStorage에 저장되고
 * JSON으로 내보내기/가져오기된다.
 */

export interface SiteTheme {
  bg: string
  ink: string
  accent: string
  accent2: string
}

export type BackgroundKind = 'none' | 'flow' | 'warp' | 'orbit'

export interface HeroSection {
  id: string
  type: 'hero'
  eyebrow: string
  title: string
  tagline: string
}

export interface FeatureSection {
  id: string
  type: 'feature'
  eyebrow: string
  title: string
  body: string
  reverse: boolean
}

export interface StatsSection {
  id: string
  type: 'stats'
  title: string
  items: { label: string; value: number; suffix: string }[]
}

export interface TimelineSection {
  id: string
  type: 'timeline'
  title: string
  items: { year: string; text: string }[]
}

export interface NoiseSection {
  id: string
  type: 'noise'
  eyebrow: string
  title: string
  body: string
}

export interface CtaSection {
  id: string
  type: 'cta'
  title: string
  body: string
  button: string
}

export type Section = HeroSection | FeatureSection | StatsSection | TimelineSection | NoiseSection | CtaSection
export type SectionType = Section['type']

export interface SiteConfig {
  version: 1
  title: string
  theme: SiteTheme
  background: BackgroundKind
  sections: Section[]
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: '히어로',
  feature: '기능 소개',
  stats: '숫자 통계',
  timeline: '타임라인',
  noise: '노이즈→정렬 그리드',
  cta: 'CTA',
}

/** 클론들의 팔레트를 재활용한 테마 프리셋 */
export const THEME_PRESETS: { name: string; theme: SiteTheme }[] = [
  { name: 'Violet', theme: { bg: '#0d0e12', ink: '#f2f0ec', accent: '#8b5cf6', accent2: '#6366f1' } },
  { name: 'Mint', theme: { bg: '#0a0f0d', ink: '#eef4f0', accent: '#6df0c2', accent2: '#5b8cff' } },
  { name: 'Lime', theme: { bg: '#0b0b0c', ink: '#f4f4f2', accent: '#c8ff4d', accent2: '#9aa0a6' } },
  { name: 'Neon', theme: { bg: '#07070d', ink: '#f5f4fb', accent: '#00f0ff', accent2: '#ff3df0' } },
  { name: 'Coral', theme: { bg: '#101320', ink: '#f5f1ea', accent: '#ff6340', accent2: '#ffd166' } },
  { name: 'Amber', theme: { bg: '#12100c', ink: '#f5efe4', accent: '#f5b942', accent2: '#8ecdf5' } },
]

export function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)
}

/** 섹션 타입별 기본값 — 빌더의 "섹션 추가"가 이 값으로 시작한다 */
export function defaultSection(type: SectionType): Section {
  const id = makeId()
  switch (type) {
    case 'hero':
      return { id, type, eyebrow: 'welcome', title: '스크롤이\n이야기가 되는 곳', tagline: '섹션과 배경을 고르고 텍스트를 바꿔 나만의 사이트를 만들어 보세요.' }
    case 'feature':
      return { id, type, eyebrow: 'Feature', title: '핵심 기능을 소개하세요', body: '이 문단에 기능의 가치를 한두 문장으로 설명합니다. 섹션이 화면에 들어오면 부드럽게 나타납니다.', reverse: false }
    case 'stats':
      return { id, type, title: '숫자로 보는 성과', items: [
        { label: '프로젝트', value: 128, suffix: '+' },
        { label: '고객 만족도', value: 98, suffix: '%' },
        { label: '평균 응답', value: 1.2, suffix: 's' },
      ] }
    case 'timeline':
      return { id, type, title: '걸어온 길', items: [
        { year: '2024', text: '첫 프로토타입 출시' },
        { year: '2025', text: '주요 고객사 확보' },
        { year: '2026', text: '글로벌 진출' },
      ] }
    case 'noise':
      return { id, type, eyebrow: 'Signal', title: '노이즈에서 신호로', body: '흩어진 점들이 스크롤에 따라 정렬됩니다. 복잡함이 질서가 되는 과정을 보여주세요.' }
    case 'cta':
      return { id, type, title: '지금 시작하세요', body: '준비되셨나요? 버튼은 커서를 향해 끌려옵니다.', button: 'Get Started' }
  }
}

export const DEMO_CONFIG: SiteConfig = {
  version: 1,
  title: 'My Scroll Site',
  theme: THEME_PRESETS[1].theme,
  background: 'flow',
  sections: [
    defaultSection('hero'),
    defaultSection('feature'),
    { ...(defaultSection('feature') as FeatureSection), reverse: true, eyebrow: 'Another', title: '두 번째 기능은 반대편에서' },
    defaultSection('stats'),
    defaultSection('cta'),
  ],
}
