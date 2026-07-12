import type { PaletteName } from '~/webgl/palettes'

export interface Capability {
  eyebrow: string
  title: string
  body: string
  palette: PaletteName
}

export const capabilities: Capability[] = [
  {
    eyebrow: 'Plan — 01',
    title: 'Reads the\nwhole codebase',
    body: '요구사항 한 줄을 실행 가능한 계획으로 바꿉니다. 저장소 전체 구조와 의존성을 먼저 이해한 뒤, 어디를 건드려야 할지부터 정합니다.',
    palette: 'plan',
  },
  {
    eyebrow: 'Build — 02',
    title: 'Writes and\ntests its own code',
    body: '격리된 샌드박스에서 코드를 작성하고, 테스트를 돌리고, 실패하면 스스로 원인을 추적해 고칩니다. 사람은 방향만 검토합니다.',
    palette: 'build',
  },
  {
    eyebrow: 'Ship — 03',
    title: 'Opens the\npull request',
    body: '변경 사항을 리뷰 가능한 단위로 나누고, 설명이 담긴 PR을 엽니다. 팀이 쓰던 도구 그대로, 팀의 규칙 안에서 일합니다.',
    palette: 'ship',
  },
]
