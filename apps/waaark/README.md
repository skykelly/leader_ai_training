# Wave Study — waaark.com 학습 클론

[waaark.com](https://waaark.com/)(프랑스 크리에이티브 스튜디오, Awwwards SOTD)의
시그니처 인터랙션을 따라 만든 학습 클론입니다. Scroll Study Library의 라이브러리 #2.

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| SVG 웨이브/리퀴드 전환 | `composables/useWavePath.ts`, `components/WaveOverlay.vue` | 위/아래 물결 가장자리 사이 영역을 path로 그리고 GSAP이 y좌표·crest를 트윈. 화면이 덮인 순간 슬라이드 교체 |
| 풀페이지 슬라이드 스냅 | `composables/useSlider.ts` | GSAP Observer가 휠/터치를 가로채는 상태 머신, 전환 중 입력 잠금, 방향키 지원 |
| 슬라이드별 전면 컬러 체인지 | `data/slides.ts` | 슬라이드마다 배경/잉크/액센트 정의, 고정 UI는 잉크 색을 따라감 |
| 일러스트 드로우온 | `components/SlideIllustration.vue` | `pathLength="1"` + stroke-dashoffset 1→0 트윈, sine yoyo 플로팅 |
| 도트 내비게이션 | `components/DotNav.vue` | 활성 도트가 pill로 길어짐, mix-blend-difference |
| 웨이브 프리로더 | `components/WaveLoader.vue` | 래퍼 하단에 물결 SVG를 붙여 위로 슬라이드 |
| 접근성 폴백 | `pages/index.vue` | prefers-reduced-motion 시 일반 스크롤 문서로 전환 |

## 실행

```bash
npm run dev --workspace apps/waaark   # http://localhost:3001
```
