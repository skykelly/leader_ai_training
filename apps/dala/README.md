# LUMEN — Dala 학습 클론

[Unseen Studio](https://unseen.co/)(구 craftedbygc)가 워크플레이스 AI 검색 도구
[Dala](https://dala.craftedbygc.com/)를 위해 만든 웹사이트(Awwwards Site of the Day)의
시그니처 기법을 따라 만든 학습 클론입니다. Scroll Study Library의 라이브러리 #7.
"파편화된 지식(fragmented knowledge)"이라는 원본의 핵심 테마를 그대로 가져와, 흩어진
파티클이 스크롤에 따라 전구(통찰) → 구체(공유된 전역 지식) 순서로 형태를 바꾸는 WebGL
파티클 시스템을 재현했습니다. 콘텐츠는 가상의 워크플레이스 AI 검색 도구 "LUMEN"으로
자체 제작했습니다.

> 이 실행 환경은 원본 사이트 직접 열람이 네트워크 정책상 차단되어 있어, 검색으로 확인한
> Dala의 알려진 기술적 시그니처("파티클이 정점에 매핑되어 하나의 형태에서 다른 형태로
> 모핑되는 WebGL 파티클 시스템", "전구가 행성이 되는" 연출)를 기반으로 재구성했습니다.

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| WebGL 파티클 다중 셰이프 모프 | `webgl/ParticleScene.ts`, `webgl/particleShaders.ts` | 카오스·전구·구체 세 형태의 정점을 모두 attribute로 지오메트리에 올려두고, `uMorph`(0..2) 유니폼 하나로 정점 셰이더에서 인접한 두 형태 사이를 GPU가 직접 보간한다. 색상도 같은 진행도로 회색→호박색→청백색으로 함께 보간된다. |
| 형태별 포인트 생성 | `webgl/shapes.ts` | 카오스는 공 내부 균일 분포, 전구는 구 셸(유리)+원통(베이스)+지그재그(필라멘트) 조합, 구체는 매끈한 구 표면 샘플링 — 세 세트 모두 같은 인덱스 수를 가져 정점 단위로 자연스럽게 자리를 옮긴다. |
| 스크롤 연동 모프 진행 | `components/ParticleCanvas.vue` | `#morph-track`(히어로+스토리 구간) 전체 스크롤 진행도를 `uMorph` 목표값(0→2)으로 매핑하고, 매 프레임 부드럽게 lerp해 스크럽한다. |
| 기능 섹션 진입 펄스 | `components/FeatureSection.vue`, `webgl/ParticleScene.ts` | 각 기능 섹션이 화면에 들어올 때 파티클 크기를 짧게 부풀렸다 되돌리는 pulse()로 반응을 준다. |
| 글자 단위 텍스트 리빌 | `composables/useSplitReveal.ts` | 다른 라이브러리와 동일한 SplitText 행 마스크 패턴 |

## 실행

```bash
npm run dev --workspace apps/dala   # http://localhost:3007
```
