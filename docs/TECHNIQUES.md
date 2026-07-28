# TECHNIQUES.md — 기법 포팅 가이드

새 사이트를 만들 때 이 문서에서 기법을 찾아 원본 경로로 바로 이동한다.
"scrollkit" 열이 ✅인 기법은 일반화 버전이 [`packages/scrollkit`](../packages/scrollkit)에 있어 import만 하면 된다
(컨테이너 크기 파라미터화·`setColors()`·`setAutoWander()`·`dispose()` 포함).
나머지는 원본 앱에서 파일 단위로 포팅한다.

## 색인

| 기법 | 원본 위치 | 의존성 | scrollkit |
|---|---|---|---|
| 흐름장(flow field) dot 배경 | `apps/pioneer/webgl/{FlowField,noise,shaders,AuraScene}.ts` | three | ✅ `FlowScene` |
| 워프 스피드 스트릭 + FOV 킥 | `apps/slingshot/webgl/WarpScene.ts` | three | ✅ `WarpScene` |
| 3D 오빗 링 + 궤도선 + 코어 빔 | `apps/dayos/webgl/{OrbitScene,orbitShaders}.ts` | three | ✅ `OrbitScene` |
| SplitText 글자 리빌 | `apps/*/composables/useSplitReveal.ts` (8앱 동일) | gsap SplitText | ✅ `splitRevealTween` |
| 커스텀 커서(점+링 이중 추적) | `apps/pioneer/components/app/AppCursor.vue` | gsap | ✅ `ScrollCursor` |
| 마그네틱 버튼 | `apps/pioneer/components/ui/MagneticButton.vue` | gsap | ✅ `ScrollMagneticButton` |
| 얼굴 파티클(albedo/depth 텍스처 샘플링) + head tracking | `apps/pioneer/webgl/{FaceParticles,faceParticleShaders}.ts` | three, gsap | — |
| 렌더 이미지 → albedo/depth 텍스처 생성 | `scripts/make-face-textures.mjs` (ffmpeg만 사용) | — | — |
| 음성 합성 + 발화 동기 파티클 진동 | `apps/pioneer/composables/useSpeech.ts` + `faceParticleShaders.ts`(uSpeech*) | Web Speech API, gsap | — |
| 클릭 리플 충격파(dot 필드) | `apps/pioneer/webgl/shaders.ts`(uRipple*) + `AuraScene.ripple()` | three, gsap | — |
| 스크롤 속도→씬 가속(flow boost) | `apps/pioneer/webgl/AuraScene.ts`(flowBoost) + `ScrollProgress.vue` | gsap ST | ✅ (Flow/Warp에 내장) |
| 노이즈 변위 발광 구체 | `apps/lusion/webgl/{coreShaders,CoreScene}.ts` | three | — |
| 후처리 없는 bloom(글로우 셸) | `apps/lusion/webgl/CoreScene.ts` — BackSide+Additive 프레넬 | three | — |
| 커서 벌지(표면 부풂) | `apps/lusion/webgl/coreShaders.ts`(uPointer/uBulge) | three | — |
| 경로(path) 튜브 + 카메라 돌리 | `apps/madar/webgl/{JourneyScene,journeyShaders}.ts` | three | — |
| 3D→2D HTML 라벨 투영 | `apps/madar/webgl/JourneyScene.ts`(getLabelData) + `JourneyCanvas.vue` | three | — |
| 파티클 멀티 셰이프 모프 + 리플 | `apps/dala/webgl/{particleShaders,shapes,ParticleScene}.ts` | three | — |
| 이미지 디스토션 패널 | `apps/slingshot/components/DistortImage.vue` | three, gsap ST | — |
| SVG 웨이브/리퀴드 전환 | `apps/waaark/composables/{useWavePath,useSlider}.ts` + `WaveOverlay.vue` | gsap Observer | — |
| 풀페이지 슬라이드 + 휠 저항 | `apps/waaark/composables/useSlider.ts`(busy/onResist) | gsap Observer | — |
| 클립패스 아이리스 리빌 + 레이어 패럴랙스 | `apps/virya/components/HeroWindow.vue` | gsap ST | — |
| SVG draw-on / 원형 게이지 / 타임라인 | `apps/virya/components/{TurbineIllustration,GaugeStat,TimelineSection}.vue` | gsap ST | — |
| SVG 모션패스 파티클 플로우 | `apps/monad/components/HeroFlow.vue` | gsap | — |
| 노이즈→시그널 그리드 모핑 | `apps/monad/components/NoiseToSignal.vue` | gsap ST | — |
| 라이브 로그 티커 | `apps/monad/components/LogTicker.vue` | gsap | — |
| 숫자 카운트업 | `apps/madar/components/StatsSection.vue` (proxy 트윈 패턴) | gsap | — |
| Lenis 관성 스크롤 연동 | `apps/pioneer/composables/useLenis.ts` | lenis, gsap | — |
| 프리로더 + 페이지 전환 와이프 | `apps/pioneer/app.vue` + `AppPreloader.vue` | gsap | — |
| 터치 auto-wander | 5개 씬의 `setAutoWander` + Canvas의 `pointer: coarse` 게이트 | — | ✅ (씬 3종 내장) |

## 공통 패턴 (새 앱에서 그대로 따를 것)

- **싱글턴 composable**: 씬 인스턴스는 모듈 스코프 1개. `init(canvas)`에서 dynamic import로
  생성해 반환, init 전 호출된 setter는 pending 값으로 저장했다가 init 시 재생.
  예: `apps/dayos/composables/useOrbit.ts` (가장 짧은 예시).
- **Canvas 컴포넌트 골격**: `prefers-reduced-motion` → 정적 폴백 div / 아니면 canvas + 씬 init
  → `pointer: coarse`면 `setAutoWander(true)` → onBeforeUnmount에서 ScrollTrigger kill + destroy.
  예: `apps/dayos/components/OrbitCanvas.vue`.
- **섹션 리빌 골격**: `gsap.context(() => {...}, rootEl)` 안에서 splitRevealTween(paused) +
  ScrollTrigger onEnter로 play, cleanup은 `return () => split.revert()` + onBeforeUnmount `ctx.revert()`.
  예: `apps/madar/components/StatsSection.vue`.

## 포팅 주의점 (기법별)

- **모든 WebGL 씬 공통**: 원본은 window 크기+`position: fixed` 전제다. 스크롤 컨테이너 안에서
  쓰려면 scrollkit 버전(호스트 요소 기준 ResizeObserver)을 쓸 것. GLSL `smoothstep`은
  정방향(edge0<edge1)만 — 역방향은 SwiftShader(검증 환경)에서 0이 나온다.
- **flow field**: 좌표계가 물리 비율 기준 — x∈[-ratio, ratio], y∈[-1,1], ratio=w/h.
  화면 좌표를 넘길 때 x에 ratio를 곱해야 한다(클릭 리플의 `nx * ratio` 참조).
- **얼굴 파티클**: 파티클의 초기 격자 위치 xy가 그대로 텍스처 UV다. albedo의
  밝기가 알파가 되어 배경(검정)이 저절로 투명해지고, depth가 z를 민다.
  상태를 누적하지 않고 `fract(t/life)` 위상만으로 수명을 돌려 CPU 갱신이 없다.
  클레이 렌더는 명암 폭이 좁아 `smoothstep`으로 레벨을 펴야 이목구비가 산다.
  public/ 에셋 경로는 `import.meta.env.BASE_URL`(=`/_nuxt/`)이 아니라
  `useRuntimeConfig().app.baseURL`을 써야 서브패스 배포에서 깨지지 않는다.
- **발화 진동**: `SpeechSynthesisUtterance.onerror`에 종료 콜백을 걸면 안 된다 —
  음성 엔진이 없는 환경(헤드리스·정책 차단)에서 즉시 발화해 모션이 시작하자마자 꺼진다.
  종료는 글자 수로 추정한 폴백 타이머가 맡고, `onboundary`를 안 주는 엔진이 많으므로
  단어 펄스도 자체 타이머로 만든다. 진동은 **크기 변조가 아니라 변위**로 줄 것 —
  additive 파티클에서 point size를 키우면 겹침이 폭증해 얼굴이 흰빛으로 타버린다
  (원본 영상은 발화 중에도 채널 포화 1% 미만).
- **depth 맵 생성**: 조명이 위에서 오는 렌더는 밝기를 그대로 깊이로 쓰면
  이마가 코보다 앞이 된다. 저주파 조명 성분을 빼고(detrend) 실루엣 거리변환
  볼륨 + 코 중심 가우시안 prior를 합성해야 순서가 맞는다.
- **오빗 링**: 궤도선을 추가할 때 JS 점열 수식이 ringVertex 셰이더 수식
  `(r·cosθ, −r·sinθ·sinI, r·sinθ·cosI)`와 **정확히 일치**해야 노드가 선 위에 올라탄다.
- **파티클 모프**: 세 셰이프 attribute는 정점 수가 같아야 한다. 리플은 `aRandom` 재사용 —
  `smoothstep(aRandom * RIPPLE, 1.0, t)`. 끝점 보존은 smoothstep(…,1.0,1.0)=1이 보장.
- **디스토션 패널**: 스크롤 속도는 `ScrollTrigger.getVelocity()`가 아니라(인스턴스 전용)
  scrollY 델타를 직접 계산. IntersectionObserver로 뷰포트 밖 패널은 렌더 skip.
- **웨이브 슬라이더**: 전환 중 입력은 `busy` ref로 잠그고, 잠금 중 입력은 `onResist` 콜백으로
  위임해 엘라스틱 저항 연출. reduced-motion이면 Observer를 끄고 문서 흐름으로 폴백.
- **커서 벌지**: 커서 레이에서 구 중심 최근접점 방향을 구한 뒤 **그룹 회전의 역쿼터니언**을
  적용해 로컬 좌표로 바꿔 uniform에 넣는다(월드 좌표 그대로 넣으면 회전과 어긋남).
- **3D→2D 라벨**: `p.clone().project(camera)` → `x=(ndc.x+1)/2*w, y=(1-ndc.y)/2*h`,
  `visible = |ndc.z| < 1`. 라벨 DOM은 `pointer-events: none` + gsap.ticker에서 transform 갱신.
- **카운트업**: DOM textContent를 직접 트윈하지 말고 `{ v: 0 }` proxy 객체를 트윈해
  onUpdate에서 `toFixed`로 써넣는다(소수점/천단위 제어).
- **프리로더**: 카운터 후 `clip-path` 마스크로 걷힘. 페이지 전환은 Vue transition JS 훅에서
  gsap 오버레이 — 전환 와이프가 화면을 덮는 동안 씬 모드를 교체하면 크로스페이드가 필요 없다.
