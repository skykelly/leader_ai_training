export interface Feature {
  eyebrow: string
  title: string
  body: string
}

/** 가상의 멀티클라우드 AI 통합 플랫폼 "NEXUS" — Dayos를 학습용으로 재해석한 자체 제작 콘텐츠 */
export const features: Feature[] = [
  {
    eyebrow: 'Actions — 01',
    title: 'AI that\ntakes action',
    body: '보고서를 생성하고, 프로세스를 실행하고, 서비스 티켓을 제출합니다. 사람은 결과만 확인하면 됩니다.',
  },
  {
    eyebrow: 'Experts — 02',
    title: 'An expert for\nevery workflow',
    body: '부서마다, 툴마다 전담 AI 에이전트가 붙어 그 업무의 맥락을 그대로 이해하고 처리합니다.',
  },
]
