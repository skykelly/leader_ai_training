export interface Stage {
  eyebrow: string
  title: string
  body: string
}

/** 가상의 보안 데이터 파이프라인 플랫폼 "CONDUIT" — Monad를 학습용으로 재해석한 자체 제작 콘텐츠 */
export const stages: Stage[] = [
  {
    eyebrow: 'Collect',
    title: '50개 툴의 로그를\n한 곳으로',
    body: '방화벽, EDR, 클라우드 감사 로그까지 — 형식도 속도도 제각각인 보안 데이터를 하나의 입구로 모읍니다.',
  },
  {
    eyebrow: 'Normalize',
    title: '형식을 하나로\n맞춥니다',
    body: '툴마다 다른 스키마를 공통 포맷으로 변환해, 어떤 소스에서 왔든 같은 방식으로 질의할 수 있게 합니다.',
  },
  {
    eyebrow: 'Filter',
    title: '노이즈는 걷어내고\n신호만 남깁니다',
    body: '중복·저가치 이벤트를 걸러내 SIEM으로 들어가는 볼륨을 줄이고, 탐지에 필요한 신호만 통과시킵니다.',
  },
  {
    eyebrow: 'Route',
    title: '목적지까지\n정확하게',
    body: '정제된 데이터를 SIEM, 데이터 레이크, 알림 채널 등 팀이 실제로 쓰는 곳으로 라우팅합니다.',
  },
]
