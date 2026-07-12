export interface Gauge {
  value: number
  suffix: string
  label: string
  color: string
}

/** 가상의 풍력 에너지 회사 "AEOLIA" — Virya Energy를 학습용으로 재해석한 자체 제작 콘텐츠 */
export const gauges: Gauge[] = [
  { value: 38, suffix: '%', label: '평균 이용률(capacity factor)', color: 'var(--teal)' },
  { value: 99, suffix: '%', label: '그리드 가동 안정성', color: 'var(--sky)' },
  { value: 94, suffix: '%', label: '주민 수용성 조사 만족도', color: 'var(--amber)' },
]

export interface Milestone {
  year: string
  title: string
  body: string
}

export const milestones: Milestone[] = [
  {
    year: '1998',
    title: '첫 커뮤니티 풍력 파일럿',
    body: '지역 주민과 함께 세운 첫 온쇼어 터빈 3기가 가동을 시작했습니다.',
  },
  {
    year: '2007',
    title: '100MW 계통 연계',
    body: '누적 발전 용량이 100MW를 넘어서며 지역 전력망의 주요 축이 되었습니다.',
  },
  {
    year: '2015',
    title: '국경 간 송전선 개통',
    body: '인접국과의 송전망을 연결해 잉여 전력을 실시간으로 주고받기 시작했습니다.',
  },
  {
    year: '2024',
    title: '온쇼어-오프쇼어 통합 운영',
    body: '육상·해상 풍력 자산을 하나의 운영 센터에서 통합 관제합니다.',
  },
]
