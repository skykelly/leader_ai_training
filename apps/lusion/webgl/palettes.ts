/** 섹션별 synthetic core 색 팔레트 (2색 그라디언트 + 글로우 셸 색) */

export type PaletteName = keyof typeof palettes

export const palettes = {
  hero: ['#6df0c2', '#7c9bff'],
  plan: ['#7c9bff', '#c586ff'],
  build: ['#c586ff', '#ff8a65'],
  ship: ['#ff8a65', '#6df0c2'],
  cta: ['#6df0c2', '#f2f3f5'],
} as const satisfies Record<string, readonly [string, string]>
