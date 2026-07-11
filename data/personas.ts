import type { PaletteName } from '~/webgl/palettes'

export type PersonaId = 'visionary' | 'explorer' | 'catalyst' | 'guardian'

export interface Persona {
  id: PersonaId
  name: string
  nameKo: string
  tagline: string
  description: string
  palette: PaletteName
  contents: { type: string; title: string }[]
}

export const personas: Record<PersonaId, Persona> = {
  visionary: {
    id: 'visionary',
    name: 'The Visionary',
    nameKo: '비저너리',
    tagline: '남들이 보지 못하는 지평선을 먼저 봅니다',
    description:
      '당신은 큰 그림을 그리는 개척자입니다. 불확실함 속에서 방향을 발견하고, 아직 오지 않은 미래를 팀이 믿게 만드는 힘이 있습니다.',
    palette: 'visionary',
    contents: [
      { type: 'Read', title: '10년 후를 상상하는 백캐스팅 사고법' },
      { type: 'Watch', title: '비전을 조직의 언어로 번역하기' },
      { type: 'Try', title: '이번 주, 팀에게 미래 시나리오 하나 공유하기' },
    ],
  },
  explorer: {
    id: 'explorer',
    name: 'The Explorer',
    nameKo: '탐험가',
    tagline: '지도 밖으로 걸어 나가는 것을 두려워하지 않습니다',
    description:
      '당신은 몸으로 부딪히는 개척자입니다. 새로운 도구와 영역을 직접 실험하며 배우고, 그 발견을 기꺼이 나눕니다.',
    palette: 'explorer',
    contents: [
      { type: 'Read', title: '빠른 실험을 위한 프로토타이핑 원칙' },
      { type: 'Watch', title: '실패 로그를 팀의 자산으로 만드는 법' },
      { type: 'Try', title: '이번 주, 처음 보는 AI 도구 하나 써보기' },
    ],
  },
  catalyst: {
    id: 'catalyst',
    name: 'The Catalyst',
    nameKo: '촉매자',
    tagline: '주변 사람들의 변화에 불을 붙입니다',
    description:
      '당신은 사람을 움직이는 개척자입니다. 에너지와 연결로 팀의 잠재력을 깨우고, 변화가 시작되는 온도를 만듭니다.',
    palette: 'catalyst',
    contents: [
      { type: 'Read', title: '저항을 동력으로 바꾸는 대화 설계' },
      { type: 'Watch', title: '변화 관리의 심리학' },
      { type: 'Try', title: '이번 주, 다른 팀과 커피챗 한 번 만들기' },
    ],
  },
  guardian: {
    id: 'guardian',
    name: 'The Guardian',
    nameKo: '수호자',
    tagline: '개척의 속도만큼 방향과 안전을 살핍니다',
    description:
      '당신은 지속가능한 개척자입니다. 신뢰와 원칙 위에 새로움을 쌓아, 팀이 멀리까지 갈 수 있게 만듭니다.',
    palette: 'guardian',
    contents: [
      { type: 'Read', title: '책임 있는 AI 도입 체크리스트' },
      { type: 'Watch', title: '심리적 안전감이 실험 문화를 만든다' },
      { type: 'Try', title: '이번 주, 팀의 우려 사항 하나 공식화하기' },
    ],
  },
}
