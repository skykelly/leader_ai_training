export interface Feature {
  eyebrow: string
  title: string
  body: string
}

/** 가상의 워크플레이스 AI 검색 도구 "LUMEN" — Dala를 학습용으로 재해석한 자체 제작 콘텐츠 */
export const features: Feature[] = [
  {
    eyebrow: 'Connect — 01',
    title: 'Every tool,\none index',
    body: '문서, 채팅, 티켓, 위키 — 흩어져 있던 모든 소스를 연결해 하나의 검색 인덱스로 모읍니다.',
  },
  {
    eyebrow: 'Search — 02',
    title: 'Ask once,\nfind everything',
    body: '자연어로 한 번 물으면, 여러 툴에 흩어진 관련 정보를 모아 근거와 함께 보여줍니다.',
  },
  {
    eyebrow: 'Share — 03',
    title: 'Answers that\nstay in sync',
    body: '원본이 바뀌면 답변도 함께 갱신됩니다. 한 번 찾은 지식이 팀 전체의 자산이 됩니다.',
  },
]
