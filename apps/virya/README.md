# AEOLIA — Virya Energy 학습 클론

[Studio Ruelle](https://www.ruelle.studio/)가 만든 풍력 에너지 기업
[Virya Energy](https://virya-energy.com/our-expertise/wind-energy/)의 웹사이트(Awwwards Honorable
Mention)에서 클립패스 히어로 리빌·SVG 일러스트 애니메이션·데이터 시각화 기법을 학습해 만든
클론입니다. Scroll Study Library의 라이브러리 #5. 콘텐츠는 가상의 풍력 에너지 기업 "AEOLIA"로
자체 제작했습니다. 다른 라이브러리와 달리 WebGL 없이 순수 SVG/DOM + GSAP만으로 구현했습니다.

> 이 실행 환경은 원본 사이트 직접 열람이 네트워크 정책상 차단되어 있어, 검색으로 확인한
> Virya Energy의 알려진 기술적 시그니처(GSAP+Lottie 기반 스크롤 애니메이션, 클립패스/마스크
> 히어로 리빌, 일러스트 스토리텔링, 데이터 시각화)를 기반으로 재구성했습니다.

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| 클립패스 아이리스 히어로 리빌 | `components/HeroWindow.vue` | ScrollTrigger로 섹션을 pin한 채, `clip-path: circle()`의 반지름을 9%→85%로 스크럽해 작은 창문이 열리듯 장면이 드러남 |
| SVG 터빈 일러스트(무한 회전 + draw-on) | `components/TurbineIllustration.vue` | 블레이드 `<g>`는 CSS keyframes로 항상 회전(Lottie 루프 캐릭터 애니메이션과 동일한 인상), 타워는 `stroke-dasharray`/`dashoffset`을 스크롤 진행도에 스크럽해 아래에서 위로 그려짐 |
| 원형 게이지 데이터 시각화 | `components/GaugeStat.vue` | SVG 원의 `stroke-dasharray`=둘레, `dashoffset`을 목표 비율만큼 GSAP으로 트윈해 도넛형 진행률 차트를 그리고 중앙 숫자를 함께 카운트업 |
| 스크롤 연동 세로 타임라인 | `components/TimelineSection.vue` | 세로선을 `scaleY(0)→1`로 스크럽하며 그리고, 각 마일스톤은 화면에 들어올 때 개별 ScrollTrigger로 페이드+슬라이드 |
| 글자 단위 텍스트 리빌 | `composables/useSplitReveal.ts` | 다른 라이브러리와 동일한 SplitText 행 마스크 패턴 |

## 실행

```bash
npm run dev --workspace apps/virya   # http://localhost:3005
```
