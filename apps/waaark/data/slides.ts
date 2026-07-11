export type IllustrationVariant = 'horizon' | 'eye' | 'grid' | 'duo' | 'plane'

export interface Slide {
  id: string
  eyebrow: string
  title: string
  body: string
  /** 슬라이드 배경색 — waaark 시그니처: 슬라이드마다 화면 전체 색이 바뀐다 */
  bg: string
  ink: string
  accent: string
  illustration: IllustrationVariant
}

export const slides: Slide[] = [
  {
    id: 'intro',
    eyebrow: 'Wave study — 01',
    title: 'We craft\nwaves',
    body: '화면을 쓸고 지나가는 웨이브, 한 장씩 넘기는 풀페이지 슬라이드. waaark.com의 시그니처 인터랙션을 그대로 따라 만드는 학습 클론입니다.',
    bg: '#f6f2ea',
    ink: '#23253c',
    accent: '#f5806e',
    illustration: 'horizon',
  },
  {
    id: 'vision',
    eyebrow: 'Vision — 02',
    title: 'See beyond\nthe fold',
    body: '스크롤은 문서를 내리는 행위가 아니라 장면을 전환하는 연출이 될 수 있습니다. 휠 한 번이 하나의 챕터가 됩니다.',
    bg: '#23253c',
    ink: '#f6f2ea',
    accent: '#6ec8c0',
    illustration: 'eye',
  },
  {
    id: 'works',
    eyebrow: 'Works — 03',
    title: 'Made with\ncare',
    body: '슬라이드 전환마다 SVG path가 GSAP 타임라인 안에서 직접 모핑됩니다. 라이브러리 없이 곡선의 제어점을 숫자로 움직이는 방식입니다.',
    bg: '#6ec8c0',
    ink: '#23253c',
    accent: '#f6f2ea',
    illustration: 'grid',
  },
  {
    id: 'team',
    eyebrow: 'Team — 04',
    title: 'Two hands,\none wave',
    body: '원본 waaark은 디자이너와 개발자 단 두 명의 스튜디오입니다. 작은 팀이 만드는 밀도 있는 디테일이 이 사이트의 본질입니다.',
    bg: '#f5806e',
    ink: '#23253c',
    accent: '#f6f2ea',
    illustration: 'duo',
  },
  {
    id: 'contact',
    eyebrow: 'Contact — 05',
    title: 'Say hello',
    body: '여기까지가 다섯 장의 웨이브였습니다. 방향키나 도트 내비게이션으로 언제든 다시 항해할 수 있습니다.',
    bg: '#1b1d2c',
    ink: '#f6f2ea',
    accent: '#6ec8c0',
    illustration: 'plane',
  },
]
