# VECTOR — Madar 학습 클론

[Vide Infra](https://videinfra.com/)가 만든 물류 플랫폼 [Madar](https://madarplatform.com/en)의
웹사이트(Awwwards/CSSDA/FWA Site of the Day)에서 핵심 3D 모티프인 "경로(path)"를 학습해 만든
클론입니다. Scroll Study Library의 라이브러리 #4. 콘텐츠는 가상의 물류 플랫폼 "VECTOR"로
자체 제작했습니다.

> 이 실행 환경은 원본 사이트 직접 열람이 네트워크 정책상 차단되어 있어, 검색으로 확인한
> Madar의 알려진 기술적 시그니처(WebGL/Three.js 경로 3D 모티프, 네이비·코럴 2색 팔레트,
> 둥근 모서리·블러 카드, 스크롤 연동 내러티브)를 기반으로 재구성했습니다.

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| 경로(path) 3D 모티프 + 스크롤 카메라 돌리 | `webgl/JourneyScene.ts` | CatmullRomCurve3로 웨이포인트를 잇는 튜브를 만들고, 문서 전체 스크롤 진행도를 카메라가 경로 위를 이동하는 위치(`getPointAt`)로 직접 매핑 |
| 네이비→코럴 그라디언트 + 이동하는 빛 파동 | `webgl/journeyShaders.ts` | 튜브 UV.x(경로 길이)로 색을 보간하고, 사인파 밝기 밴드가 시간에 따라 진행 방향으로 흐르며 "화물이 이동하는" 느낌을 만듦 |
| 웨이포인트 노드 발광 | `webgl/JourneyScene.ts` | 각 정류장에 core + BackSide additive 글로우 셸(lusion과 동일 기법)을 두고, 해당 섹션 진입 시 GSAP으로 펄스·밝기 강조 |
| 둥근 모서리 + 블러 카드(glassmorphism) | `assets/styles/main.scss`(`.glass`), `components/StatsSection.vue` | `backdrop-filter: blur()` + 큰 `border-radius`로 통계 카드를 반투명 유리처럼 표현 |
| 숫자 카운트업 | `components/StatsSection.vue` | 섹션 진입 시 GSAP proxy 객체를 0→목표값으로 트윈하며 텍스트를 갱신 |
| 글자 단위 텍스트 리빌 | `composables/useSplitReveal.ts` | 다른 라이브러리와 동일한 SplitText 행 마스크 패턴 |
| 커스텀 커서 + 마그네틱 버튼 | `components/AppCursor.vue`, `MagneticButton.vue` | 기존 라이브러리 패턴 재사용 |

## 실행

```bash
npm run dev --workspace apps/madar   # http://localhost:3004
```
