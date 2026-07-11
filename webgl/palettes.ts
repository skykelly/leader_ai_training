/** 섹션·파이오니어 유형별 아우라 색 팔레트 (3색 그라디언트) */

export type PaletteName = keyof typeof palettes

export const palettes = {
  // 홈 섹션
  hero: ['#8b5cf6', '#22d3ee', '#f472b6'],
  frontier: ['#22d3ee', '#3b82f6', '#8b5cf6'],
  power: ['#f472b6', '#fb923c', '#8b5cf6'],
  cta: ['#a78bfa', '#f0abfc', '#22d3ee'],

  // 파이오니어 유형
  visionary: ['#a78bfa', '#f0abfc', '#60a5fa'],
  explorer: ['#22d3ee', '#34d399', '#3b82f6'],
  catalyst: ['#fb923c', '#f472b6', '#facc15'],
  guardian: ['#34d399', '#22d3ee', '#a3e635'],
} as const satisfies Record<string, readonly [string, string, string]>
