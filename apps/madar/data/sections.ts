export interface Feature {
  eyebrow: string
  title: string
  body: string
}

/** 가상의 물류 플랫폼 "VECTOR" — Madar를 학습용으로 재해석한 자체 제작 콘텐츠 */
export const features: Feature[] = [
  {
    eyebrow: 'Visibility — 01',
    title: 'See every\nshipment move',
    body: '화물이 지금 어느 경유지에 있는지, 다음 정류장은 어디인지 실시간으로 나타납니다. 예상 밖의 지연도 경로 위에 곧바로 표시됩니다.',
  },
  {
    eyebrow: 'Automation — 02',
    title: 'Compliance\nruns itself',
    body: '통관·행정 서류를 자동으로 채우고 제출합니다. 사람은 예외가 발생했을 때만 개입하면 됩니다.',
  },
  {
    eyebrow: 'Marketplace — 03',
    title: 'Match the\nright carrier',
    body: '경로와 화물 특성에 맞는 운송사를 자동으로 연결하고, 정산까지 한 화면에서 끝냅니다.',
  },
]

/** 경로 위 6개 웨이포인트의 정류장 라벨 — JourneyScene의 WAYPOINTS 순서와 1:1 대응 */
export const waypointLabels = ['Origin', 'Visibility', 'Automation', 'Marketplace', 'Numbers', 'Departure'] as const

export interface Stat {
  value: number
  suffix: string
  label: string
}

export const stats: Stat[] = [
  { value: 42, suffix: '개국', label: '연결된 물류 거점' },
  { value: 2.3, suffix: 'M', label: '추적 중인 화물' },
  { value: 68, suffix: '%', label: '더 빨라진 통관 처리' },
  { value: 24, suffix: '/7', label: '실시간 경로 가시성' },
]
