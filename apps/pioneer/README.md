# Prepare to Pioneer — 스크롤리텔링 학습 클론

[preparetopioneer.com](https://preparetopioneer.com/)(DEPT 에이전시)의 인터랙티브·스크롤리텔링 기법을
학습하기 위해 동일한 구성과 기술 패턴으로 재현한 프로젝트입니다.
원본은 Nuxt.js + 자체 WebGL 라이브러리(AstroGL)로 제작되었고,
이 프로젝트는 **Nuxt 3 + GSAP + Three.js + Lenis**로 같은 효과를 구현합니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # 정적 빌드 → .output/public (GitHub Pages 등에 배포 가능)
```

## 페이지 구성

- **/** — 스크롤 내러티브: 프리로더 → 히어로 → 핀 고정 챕터 3개 → 마퀴 → 필러(카운터) → CTA → 푸터
- **/experience** — 진단 플로우: 인트로 → 5문항(선택마다 아우라 모핑) → 파이오니어 유형 결과(4종, 규칙 기반 스코어링)

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| 관성 스무스 스크롤 | `composables/useLenis.ts` | Lenis rAF를 GSAP ticker가 구동, `lenis.on('scroll', ScrollTrigger.update)`로 동기화 |
| 핀 고정 + 스크럽 | `components/sections/NarrativeSection.vue` | ScrollTrigger `pin` + `scrub` — 섹션을 고정한 채 스크롤 양으로 타임라인을 문지름 |
| 글자 단위 텍스트 리빌 | `composables/useSplitReveal.ts` | GSAP SplitText(3.13부터 무료)로 행 마스크 안에서 글자가 올라오는 시그니처 리빌 |
| 흐름장(flow field) dot 배경 | `webgl/FlowField.ts`, `webgl/noise.ts` | 점을 격자에 고정하지 않고 CPU에서 매 프레임 적분. simplex noise(x,y,t)를 각도로 해석해 그 방향으로 전진, 경계에서 랩어라운드 |
| 얼굴 3D point cloud + head tracking | `webgl/FaceCloud.ts` | 타원 실루엣 안 격자 샘플링 + 가우시안 범프로 코·볼·입술·턱 깊이(z) 조형, 눈은 점을 비워 구멍으로. 커서 좌표를 yaw/pitch로 lerp해 매 프레임 회전 |
| dot 필드 셰이더(공유) | `webgl/AuraScene.ts`, `webgl/shaders.ts` | Points 하나를 flow/face 두 드라이버가 번갈아 채움. simplex noise 브리딩 밝기, z(깊이)를 밝기·크기로 되먹임, 커서 로컬 글로우는 flow에만(`uMouseFx`) |
| 섹션별 색 모핑 | `webgl/palettes.ts`, `composables/useAura.ts` | 전역 캔버스 1개를 두고 각 섹션이 `aura.setPalette()`로 색상 uniform을 GSAP lerp. `aura.setMode('flow'|'face')`로 배경 드라이버 전환 |
| 패럴랙스 | `NarrativeSection.vue`의 거대 숫자 | 스크럽 타임라인에서 `yPercent`를 다른 속도로 이동 |
| 무한 마퀴 | `components/app/AppMarquee.vue` | 동일 텍스트 4회 반복 후 `xPercent: -25` 무한 트윈 |
| 숫자 카운터 | `components/sections/PillarsSection.vue` | 뷰포트 진입 시 객체 값을 트윈하며 textContent 갱신 |
| 프리로더 | `components/app/AppPreloader.vue` | 카운터 연출 후 `clip-path` 마스크 리빌, 완료 상태를 `useState`로 공유해 히어로 인트로 트리거 |
| 페이지 전환 와이프 | `app.vue` | Vue transition JS 훅에서 GSAP으로 오버레이가 덮고 걷히는 연출 + `ScrollTrigger.refresh()` |
| 커스텀 커서 | `components/app/AppCursor.vue` | `gsap.quickTo`로 점(즉시)/링(관성) 이중 추적, 인터랙티브 요소 위에서 확대 |
| 마그네틱 버튼 | `components/ui/MagneticButton.vue` | 커서 방향으로 끌려오고 elastic 이징으로 복귀 |
| 접근성 폴백 | `components/app/AuraCanvas.vue` 등 | `prefers-reduced-motion` 시 WebGL 대신 정적 그라디언트, 스무스 스크롤 비활성 |

## 진단 로직

`data/questions.ts`의 각 선택지가 유형별 가중치를 갖고, 합산 최다 득점 유형
(`data/personas.ts`: Visionary / Explorer / Catalyst / Guardian)이 결과가 됩니다.
선택 순간마다 해당 유형의 팔레트로 아우라가 모핑하고 펄스가 발생합니다.

## 배포

Scroll Study Library 모노레포의 라이브러리 #1로, `scripts/build-dist.sh`가
`/leader_ai_training/pioneer/` base path로 빌드해 함께 배포합니다. 루트 README를 참고하세요.

## 참고

- nuxt는 3.20.2로 고정되어 있습니다 — 3.21.8의 `ssr: false` dev 서버 버그
  (`No entry found in rollupOptions.input`) 회피 목적.
