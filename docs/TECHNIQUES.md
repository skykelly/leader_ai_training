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
| 얼굴 파티클(depth/normal 텍스처 샘플링 + 가중 배치) + head tracking | `apps/pioneer/webgl/{FaceParticles,faceParticleShaders}.ts` | three, gsap | — |
| 3D 모델(GLB) → depth/normal 텍스처 베이킹 | `scripts/bake-face-textures.mjs` (headless three, 런타임 의존성 없음) | — | — |
| 렌더 이미지 → albedo/depth 텍스처 추정 | `scripts/make-face-textures.mjs` (모델이 없을 때, ffmpeg만 사용) | — | — |
| 타이핑 텍스트 출력 + 출력 동기 파티클 진동 | `apps/pioneer/components/experience/TypedText.vue` + `composables/{useTypewriter,useFaceType}.ts` + `faceParticleShaders.ts`(uType*) | gsap | — |
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
  톤을 원본 영상과 맞출 때는 **얼굴 바운딩박스 대비 비율로 자른 같은 부위**를 비교하고
  흰 UI 텍스트를 채도로 걸러낼 것 — 안 그러면 텍스트가 포화율을 부풀린다.
  수명 페이드 창이 좁으면 절반이 항상 꺼져 얼굴에 구멍이 생긴다(창을 넓히면
  동시 표시 수가 늘어 밝아지므로 색 계수를 함께 내려야 한다).
- **타이핑 진동**: 타이머는 경과 시간에서 목표 인덱스를 계산할 것 — `setInterval` 누적
  방식은 탭이 백그라운드에 다녀오면 한꺼번에 튄다. 펄스 감쇠가 글자 간격보다 길면
  값이 최대치에 눌러앉아 리듬이 사라지므로 짧게(0.05s↑/0.18s↓) 준다.
  타이핑 중에도 레이아웃이 안 흔들리게 완성 문장을 `visibility: hidden`으로 깔고
  실제 글자는 그 위에 절대배치한다(`TypedText.vue`가 이 구조를 캡슐화한다).
  문단이 여럿이면 진동을 문단마다 껐다 켜지 말고 활성 개수를 세어 마지막에만
  풀 것 — 문단 사이가 깜빡인다(`useFaceType`). SplitText를 걷어내면 글자 단위가 아니라 단어 단위로
  줄이 접혀 `max-width: Nch`의 결과 줄 수가 달라진다 — 폭을 다시 잡을 것.
  진동은 **크기 변조가 아니라 변위**로 줄 것 — additive 파티클에서 point size를 키우면
  겹침이 폭증해 얼굴이 마젠타로 타버린다.
- **확산 링(동심원)**: `cos(d*k + t*w)` 무한 사인파는 링이 여러 겹 동시에 깔려
  "퍼져나간다"가 아니라 "전체가 출렁인다"로 읽힌다. 링마다 탄생 시각을 배열
  uniform으로 받아 나이로 반지름을 키우고 수명이 다하면 꺼지게 할 것.
  다만 링 배열로 바꿔도 아래 셋이 빠지면 여전히 출렁임으로 읽힌다:
  ① 파형은 가우시안의 **미분**(`-2x·e^(-x²)`) — 양의 봉우리만 쓰면 띠 안의 점이
  전부 같은 방향으로 부풀어 덩어리가 지나가는 모양이 된다.
  ② 탄생 시 진폭 페이드인 — 나이 0에서는 반지름도 0이라 중앙 전체가 한 점에
  겹치는데, 거기서 최대 진폭이면 얼굴 중앙이 통째로 튄다.
  ③ 반지름에 반비례하는 감쇠(`1/(1+r·k)`) — 원주가 커지는 만큼 에너지가 흩어진다.
  발사 간격이 수명보다 짧으면 다시 겹쳐 뭉개지므로 **수명 < 발사 간격 × 2~3**으로
  잡는다(글자마다가 아니라 단어마다 쏘는 이유). 링은 `uTypeFactor`에 곱하지 말 것 —
  마지막 단어의 링이 끝까지 퍼져야 한다. 검증은 같은 uTime에서 링만 껐다 켠 두 장의
  차이의 **반경 가중 평균**이 나이에 따라 단조 증가하는지로 본다.
- **모델 베이킹 vs 이미지 추정**: 정면 렌더 한 장에서 깊이를 추정하면(거리변환 +
  가우시안 prior + 조명 detrend) 조명이 곧 깊이로 새어들어 이마가 코보다 앞이 되는
  등 계속 손봐야 한다. 3D 모델이 있으면 깊이 버퍼와 법선 버퍼를 그냥 렌더하면 되고
  추정 파이프라인이 통째로 사라진다. 모델은 런타임에 싣지 말고(24MB) **오프라인에서
  텍스처만 구울 것**(수백 KB) — 런타임 구조는 그대로다.
  베이킹 시 주의: ① 자동 프레이밍(정수리~턱 크롭)은 **마스크를 끈 실루엣**으로 재야
  한다(켠 채로 재면 잘린 모양 기준으로 크롭이 잡힌다). ② 깊이는 보이는 앞면의 범위로
  재정규화해야 8비트를 알뜰히 쓴다. ③ 커버리지를 별도 채널(G)에 담을 것 — 밝기 기반
  마스크는 어두운 이목구비를 구멍으로 만든다.
- **법선 relighting**: 법선이 정확해도 **광원이 정면이면 형태가 안 보인다** —
  얼굴 앞면 전체에서 `dot(n,L)`이 1에 가까워 코·눈두덩·입술이 같은 밝기로 뭉개진다.
  반드시 비스듬한 광원 + 하프 램버트(그림자 경계가 뚝 끊기지 않게) + 좁은 하이라이트
  (`pow(key, 7)`)로 능선을 집어낼 것. 조명 대비를 바꾸면 additive 누적 평균이 함께
  변하므로 색 계수를 다시 맞춰야 한다.
- **파문의 색 전환**: 밝기만 더하면(`color += tint * wave`) 이미 밝은 쪽에서 묻힌다.
  `mix()`로 색을 갈아끼우면 파문이 어디를 지나는지 또렷하다. 다만 계수를 1에
  가깝게 두면 얼굴이 통째로 사라지므로 0.6 안팎에서 바탕이 비치게 할 것.
  색을 명암에 따라 섞을 때도(밝은 쪽=그린, 그림자=보라) 전면을 균일하게
  물들이지 말 것 — 그림자에 원래 색이 남아야 명암이 색으로도 읽혀 입체가 산다.
- **파티클 가중 배치**: 커버리지 맵에서 뽑으면 얼굴 밖에 버려지는 파티클이 없다.
  단축 보정(1/|n.z|)은 **얕게만** 줄 것 — 그대로 쓰면 실루엣에 몰려 얼굴이 테두리만
  남는다. 정면 위주 연출에서는 화면 균등에 가까운 쪽이 형태가 잘 읽힌다.
- **이목구비 지우기**: 클레이 렌더에서 입술은 너무 어두워 전경 판정(`isFg`)에
  걸리지 않는다 — albedo에 어두운 띠로 남는 게 아니라 아예 **마스크 구멍**이라
  값만 덮어써서는 지워지지 않는다. 마스크부터 메울 것. 그리고 **거리변환보다
  먼저** 해야 한다(구멍이 남은 채로 거리를 재면 그 자리의 볼륨이 0이 되어
  depth에도 골이 파인다). 메우는 값은 흐린 복사본을 섞지 말고 **가로 방향
  보간**으로 만든다 — 흐린 복사본에는 지우려는 이목구비가 그대로 들어 있어
  유령처럼 남는다. 이 부위의 명암은 거의 세로로만 변하므로 좌우 바깥값을
  이으면 세로 그라디언트를 보존한 채 지울 수 있다.
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
