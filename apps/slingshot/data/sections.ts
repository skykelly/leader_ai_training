export interface Feature {
  eyebrow: string
  title: string
  body: string
}

/** 가상의 필름 데일리즈 글로벌 전송 서비스 "TACHYON" — Sling Shot Intergalactic을 학습용으로 재해석한 자체 제작 콘텐츠 */
export const features: Feature[] = [
  {
    eyebrow: 'Send — 01',
    title: 'Petabytes,\ngone in a blink',
    body: '할리우드에서 방콕까지, 하루치 데일리즈를 암호화해 전 세계 허브로 순식간에 전송합니다.',
  },
  {
    eyebrow: 'Store — 02',
    title: 'Every cut,\none cloud',
    body: '편집·색보정·사운드 팀이 같은 클라우드에서 같은 컷을 봅니다. 시간대가 달라도 항상 최신 버전입니다.',
  },
  {
    eyebrow: 'Archive — 03',
    title: 'Nothing gets\nlost in transit',
    body: '전송이 끝난 원본은 이중화된 장기 보관소에 안전하게 남아, 몇 년 뒤에도 그대로 꺼내 쓸 수 있습니다.',
  },
]
