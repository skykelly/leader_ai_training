import type { PersonaId } from './personas'

export interface Choice {
  label: string
  /** 유형별 가중치 — 합산해 최다 득점 유형이 결과가 된다 */
  weights: Partial<Record<PersonaId, number>>
}

export interface Question {
  prompt: string
  promptEn: string
  choices: Choice[]
}

export const questions: Question[] = [
  {
    promptEn: 'Uncharted territory',
    prompt: '아무도 가보지 않은 프로젝트가 주어졌습니다. 첫 행동은?',
    choices: [
      { label: '최종 그림부터 그린다 — 끝에서 역산한다', weights: { visionary: 2 } },
      { label: '일단 작게 만들어 본다 — 손으로 배운다', weights: { explorer: 2 } },
      { label: '함께할 사람부터 모은다', weights: { catalyst: 2 } },
      { label: '리스크와 원칙을 먼저 정리한다', weights: { guardian: 2 } },
    ],
  },
  {
    promptEn: 'Fuel of choice',
    prompt: '당신을 가장 움직이게 하는 것은?',
    choices: [
      { label: '아직 오지 않은 미래에 대한 상상', weights: { visionary: 2 } },
      { label: '새로운 것을 직접 다뤄보는 손맛', weights: { explorer: 2 } },
      { label: '사람들의 눈빛이 바뀌는 순간', weights: { catalyst: 2 } },
      { label: '어제보다 단단해진 시스템', weights: { guardian: 2 } },
    ],
  },
  {
    promptEn: 'When things break',
    prompt: '실험이 실패로 끝났습니다. 당신의 반응은?',
    choices: [
      { label: '가설을 수정하고 더 큰 그림에 반영한다', weights: { visionary: 2 } },
      { label: '즉시 다음 실험을 설계한다', weights: { explorer: 2, catalyst: 1 } },
      { label: '팀이 좌절하지 않게 회고를 이끈다', weights: { catalyst: 2, guardian: 1 } },
      { label: '무엇이 우리를 지켜줬는지 기록한다', weights: { guardian: 2 } },
    ],
  },
  {
    promptEn: 'Your compass',
    prompt: '결정이 어려울 때 당신의 나침반은?',
    choices: [
      { label: '10년 뒤에도 옳을 선택인가', weights: { visionary: 2, guardian: 1 } },
      { label: '지금 가장 많이 배울 수 있는 선택인가', weights: { explorer: 2 } },
      { label: '사람들이 함께 갈 수 있는 선택인가', weights: { catalyst: 2 } },
      { label: '되돌릴 수 있는 선택인가', weights: { guardian: 2, explorer: 1 } },
    ],
  },
  {
    promptEn: 'Legacy',
    prompt: '개척이 끝난 뒤, 어떤 사람으로 기억되고 싶나요?',
    choices: [
      { label: '길이 있다는 걸 처음 보여준 사람', weights: { visionary: 2 } },
      { label: '그 길을 처음 걸은 사람', weights: { explorer: 2 } },
      { label: '모두를 그 길로 데려간 사람', weights: { catalyst: 2 } },
      { label: '그 길을 오래 걷게 만든 사람', weights: { guardian: 2 } },
    ],
  },
]
