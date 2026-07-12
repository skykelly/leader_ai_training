# CONDUIT — Monad 컨셉 학습 클론

보안 데이터 파이프라인 플랫폼 [Monad](https://www.monad.com/)의 제품 컨셉("여러 보안 툴의 데이터를
수집·정규화·필터링·라우팅한다")을 바탕으로 만든 학습 클론입니다. Scroll Study Library의
라이브러리 #6. Monad는 알려진 수상 이력이나 문서화된 시그니처 기법이 없어, 원본 사이트의 정확한
구현을 재현하는 대신 "데이터 파이프라인"이라는 제품 컨셉 자체를 스크롤리텔링 기법으로
직접 설계했습니다. 콘텐츠는 가상의 보안 데이터 파이프라인 플랫폼 "CONDUIT"으로 자체 제작했습니다.
다른 라이브러리와 달리 WebGL 없이 순수 SVG/DOM + GSAP만으로 구현했습니다.

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| SVG 모션패스 파티클 플로우 | `components/HeroFlow.vue` | 여러 소스 노드에서 중앙 파이프 노드로 이어지는 베지어 곡선 위를, `path.getTotalLength()`/`getPointAtLength()`로 매 프레임 위치를 계산한 파티클이 위상차를 두고 흐른다. 파이프를 통과한 뒤에는 노이즈색에서 시그널색으로 바뀐다. |
| 스크롤 핀 파이프라인 단계 다이어그램 | `components/PipelineStages.vue` | 섹션을 pin한 채, 가로 파이프 경로의 `stroke-dashoffset`을 스크롤 진행도로 스크럽해 진행 상태를 채우고, 진행도에 따라 4단계(Collect/Normalize/Filter/Route) 노드와 설명 패널이 순차적으로 활성화·크로스페이드된다. |
| Noise → Signal 스크럽 모핑 | `components/NoiseToSignal.vue` | 각 점에 무작위(noise) 좌표와 정렬된 그리드(signal) 좌표를 미리 계산해두고, ScrollTrigger 진행도로 두 좌표를 선형보간(lerp)한다. `color-mix()`로 색상도 함께 노이즈색→시그널색으로 전환된다. |
| 글자 단위 텍스트 리빌 | `composables/useSplitReveal.ts` | 다른 라이브러리와 동일한 SplitText 행 마스크 패턴 |

## 실행

```bash
npm run dev --workspace apps/monad   # http://localhost:3006
```
