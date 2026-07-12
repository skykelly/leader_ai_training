export interface Technique {
  /** 기법 이름 */
  name: string
  /** 어떻게 구현했는지 한 문단 설명 */
  how: string
  /** 클론 소스에서 구현을 찾을 수 있는 위치 */
  file?: string
}

export interface Library {
  slug: string
  title: string
  titleKo: string
  /** 카드에 표시되는 한 줄 요약 */
  tagline: string
  original: { name: string; url: string }
  year: string
  stack: string[]
  /** 카드/상세 상단의 포인트 색 */
  accent: string
  thumb: string
  summary: string
  techniques: Technique[]
}

export const libraries: Library[] = [
  {
    slug: 'pioneer',
    title: 'Prepare to Pioneer',
    titleKo: '파이오니어 — 인터랙티브 dot 필드와 스크롤 내러티브',
    tagline: '흐르는 dot 필드 · 커서를 바라보는 얼굴 point cloud · 핀 고정 스크럽',
    original: { name: 'preparetopioneer.com (DEPT)', url: 'https://preparetopioneer.com/' },
    year: '2026.07',
    stack: ['Nuxt 3', 'GSAP ScrollTrigger', 'Three.js', 'Lenis', 'SplitText'],
    accent: '#8b5cf6',
    thumb: 'thumbs/pioneer.png',
    summary:
      'DEPT 에이전시의 AI 캠페인 사이트를 따라 만든 첫 번째 학습 클론입니다. 홈에서는 노이즈 흐름장을 따라 실제로 이동하는 dot 필드가 배경이 되고, 진단 페이지(/experience)에서는 파라메트릭으로 조형한 얼굴 point cloud가 커서 방향으로 고개를 돌립니다. 두 모드 모두 같은 THREE.Points 파이프라인을 공유하며, 질문에 답하면 파이오니어 유형에 맞춰 팔레트가 모핑됩니다. 원본은 Nuxt.js와 DEPT 자체 WebGL 라이브러리(AstroGL)로 제작되었습니다.',
    techniques: [
      {
        name: '흐름장(flow field) dot 배경',
        how: '격자에 고정하지 않고, 각 점을 CPU에서 매 프레임 적분한다. simplex noise(x,y,t)를 각도로 해석해 그 방향으로 전진시키는 표준 flow field 기법 — 점들이 실제로 유체처럼 화면을 표류하다 경계에서 반대편으로 랩어라운드된다.',
        file: 'apps/pioneer/webgl/FlowField.ts',
      },
      {
        name: '얼굴 3D point cloud + head tracking',
        how: '외부 3D 모델 없이, 타원 실루엣 안에서 격자 샘플링한 뒤 가우시안 범프를 합성해 코·볼·입술·턱의 깊이(z)를 만들고 눈 위치는 점을 비워 구멍으로 읽히게 한다. 커서 좌표를 yaw/pitch 목표각으로 lerp해 매 프레임 얼굴 전체를 회전시키고, 회전 후 z값을 밝기·크기에 되먹여 가까운 쪽은 밝고 큼직하게, 먼 쪽은 옆모습처럼 흐리게 만들어 입체감을 낸다.',
        file: 'apps/pioneer/webgl/FaceCloud.ts',
      },
      {
        name: 'dot 필드 셰이더(공유)',
        how: 'THREE.Points 하나를 flow/face 두 "드라이버"가 번갈아 채운다. 점마다 simplex noise로 밝기가 숨쉬듯 변하고, 커서 근처 글로우·밀어내기는 flow 모드에만(uMouseFx) 적용해 얼굴 모드에서는 head-tracking 회전만이 마우스 반응을 담당하도록 분리했다.',
        file: 'apps/pioneer/webgl/AuraScene.ts',
      },
      {
        name: '관성 스무스 스크롤',
        how: 'Lenis의 rAF를 GSAP ticker가 구동하고, 스크롤 이벤트마다 ScrollTrigger.update를 호출해 관성 스크롤과 scrub 애니메이션을 동기화합니다.',
        file: 'apps/pioneer/composables/useLenis.ts',
      },
      {
        name: '핀 고정 + 스크럽 내러티브',
        how: 'ScrollTrigger의 pin과 scrub으로 섹션을 화면에 고정한 채 스크롤 양으로 타임라인을 문지릅니다. 챕터 진입 시 전역 dot 필드의 팔레트가 모핑됩니다.',
        file: 'apps/pioneer/components/sections/NarrativeSection.vue',
      },
      {
        name: '글자 단위 텍스트 리빌',
        how: 'GSAP SplitText로 행 마스크 안에서 글자가 올라오는 시그니처 리빌을 만들었습니다. 히어로·챕터 제목·결과 화면이 모두 같은 헬퍼를 공유합니다.',
        file: 'apps/pioneer/composables/useSplitReveal.ts',
      },
      {
        name: '프리로더 + 페이지 전환 와이프',
        how: '카운터 연출 뒤 clip-path 마스크로 걷히는 프리로더, 그리고 Vue transition JS 훅에서 GSAP 오버레이가 화면을 덮었다 걷히는 페이지 전환을 구현했습니다.',
        file: 'apps/pioneer/app.vue',
      },
      {
        name: '규칙 기반 진단 플로우',
        how: '다섯 질문의 선택지마다 유형별 가중치를 부여하고 합산 최다 득점 유형을 결과로 보여줍니다. 선택 순간마다 dot 필드가 해당 유형의 팔레트로 모핑하며 펄스가 발생합니다.',
        file: 'apps/pioneer/pages/experience.vue',
      },
      {
        name: '커스텀 커서 + 마그네틱 버튼',
        how: 'gsap.quickTo로 점(즉시)과 링(관성)을 이중 추적하고, 버튼은 커서 방향으로 끌려왔다 elastic 이징으로 복귀합니다.',
        file: 'apps/pioneer/components/ui/MagneticButton.vue',
      },
    ],
  },
  {
    slug: 'waaark',
    title: 'Wave Study',
    titleKo: '웨이브 — 풀페이지 슬라이드와 SVG 리퀴드 전환',
    tagline: 'SVG 웨이브 모핑 · 풀페이지 슬라이드 스냅 · 일러스트 드로우온',
    original: { name: 'waaark.com', url: 'https://waaark.com/' },
    year: '2026.07',
    stack: ['Nuxt 3', 'GSAP Observer', 'SVG path morphing', 'SplitText'],
    accent: '#6ec8c0',
    thumb: 'thumbs/waaark.png',
    summary:
      '프랑스 크리에이티브 스튜디오 waaark의 시그니처인 웨이브/리퀴드 전환을 따라 만든 두 번째 학습 클론입니다. 휠 한 번이 한 장의 슬라이드가 되는 풀페이지 내비게이션 위에서, SVG path의 제어점을 GSAP 타임라인이 직접 움직이며 화면을 쓸고 지나갑니다.',
    techniques: [
      {
        name: 'SVG 웨이브/리퀴드 전환',
        how: '위·아래 두 물결 가장자리 사이 영역을 하나의 path로 그리는 생성기를 만들고, GSAP 타임라인이 가장자리 y좌표와 crest(제어점 오프셋)를 트윈합니다. 웨이브가 화면을 완전히 덮은 순간 슬라이드가 교체되고 위로 빠져나가며 새 장면을 공개합니다.',
        file: 'apps/waaark/composables/useWavePath.ts',
      },
      {
        name: '풀페이지 슬라이드 스냅(스크롤 하이재킹)',
        how: 'GSAP Observer가 휠/터치 입력을 가로채 슬라이드 상태 머신으로 흘려보냅니다. 전환 중에는 입력이 잠기고, 연출이 끝나야 다음 입력을 받습니다. 방향키·PageUp/Down도 같은 경로를 탑니다.',
        file: 'apps/waaark/composables/useSlider.ts',
      },
      {
        name: '슬라이드별 전면 컬러 체인지',
        how: '슬라이드마다 배경·잉크·액센트 색을 데이터로 정의하고 화면 전체가 크림→네이비→티일→코럴로 완전히 바뀝니다. 고정 UI(로고·카운터)는 현재 슬라이드의 잉크 색을 따라갑니다.',
        file: 'apps/waaark/data/slides.ts',
      },
      {
        name: '일러스트 드로우온',
        how: 'SVG 스트로크에 pathLength="1"을 지정해 stroke-dashoffset을 1→0으로 트윈하면 선이 그려집니다. 그려진 일러스트는 sine 이징의 yoyo 루프로 둥실거립니다.',
        file: 'apps/waaark/components/SlideIllustration.vue',
      },
      {
        name: '도트 내비게이션',
        how: '우측 고정 도트가 현재 슬라이드에서 세로로 길어지는 pill 형태로 변합니다. mix-blend-difference로 어떤 배경색 위에서도 보입니다.',
        file: 'apps/waaark/components/DotNav.vue',
      },
      {
        name: '웨이브 프리로더',
        how: '로더 래퍼의 하단에 물결 모양 SVG를 이어 붙이고 래퍼 전체를 위로 슬라이드시켜, 물결 가장자리가 화면을 쓸고 지나가며 첫 슬라이드를 공개합니다.',
        file: 'apps/waaark/components/WaveLoader.vue',
      },
      {
        name: '모션 감소 접근성 폴백',
        how: 'prefers-reduced-motion 환경에서는 Observer와 웨이브를 끄고 슬라이드를 일반 문서 흐름으로 쌓아 네이티브 스크롤로 열람할 수 있게 합니다.',
        file: 'apps/waaark/pages/index.vue',
      },
    ],
  },
  {
    slug: 'lusion',
    title: 'COGENT',
    titleKo: '코젠트 — 실시간 3D 셰이더 히어로와 스크롤 컬러 모핑',
    tagline: '노이즈 변위 셰이더 · 프레넬 글로우 · 후처리 없는 bloom · 스크롤 팔레트 모핑',
    original: { name: 'Lusion — Devin AI 웹사이트', url: 'https://archive-devin-ai.lusion.co' },
    year: '2026.07',
    stack: ['Nuxt 3', 'Three.js', 'Custom GLSL', 'GSAP ScrollTrigger'],
    accent: '#6df0c2',
    thumb: 'thumbs/lusion.png',
    summary:
      '3D·인터랙티브 웹 스튜디오 Lusion이 Cognition의 AI 소프트웨어 엔지니어 "Devin"을 위해 만든 웹사이트를 따라 만든 학습 클론입니다. 실시간으로 표면이 일렁이는 발광 구체가 페이지 내내 화면 중심에 머무르며, 스크롤로 진입하는 섹션마다 색과 크기가 모핑됩니다. 콘텐츠는 가상의 AI 코딩 에이전트 "COGENT"로 자체 제작했습니다.',
    techniques: [
      {
        name: '노이즈 변위 발광 구체(synthetic core)',
        how: 'IcosahedronGeometry의 정점을 버텍스 셰이더에서 3D simplex noise로 법선 방향으로 밀어내 매 프레임 유기적으로 일렁이게 합니다. 프래그먼트 셰이더는 프레넬(시야각 기반) 항으로 가장자리를 밝혀 발광하는 느낌을 만듭니다.',
        file: 'apps/lusion/webgl/coreShaders.ts',
      },
      {
        name: '후처리 없는 bloom(글로우 셸)',
        how: 'EffectComposer 없이, core보다 살짝 큰 반투명 구를 BackSide + AdditiveBlending으로 뒤에 겹쳐 그립니다. 프레넬 알파로 가장자리만 빛나 저비용으로 bloom을 흉내냅니다.',
        file: 'apps/lusion/webgl/CoreScene.ts',
      },
      {
        name: '스크롤 섹션 → 색/스케일 모핑',
        how: 'ScrollTrigger가 섹션 진입을 감지하면 core/glow 색상 uniform과 그룹 스케일을 GSAP으로 lerp합니다. 전역 캔버스 하나가 페이지 전체에서 유지되어, 스크롤이 곧 "장면 전환"처럼 느껴집니다.',
        file: 'apps/lusion/components/CapabilitySection.vue',
      },
      {
        name: '마우스 패럴랙스 회전',
        how: '커서 위치를 lerp해 오브젝트 그룹의 회전에 자동 회전값과 더해 합성합니다. 자동 회전은 계속 누적되고, 마우스 오프셋은 그 위에 얹히는 방식이라 회전이 끊기지 않습니다.',
        file: 'apps/lusion/webgl/CoreScene.ts',
      },
      {
        name: '별 필드 배경',
        how: '구면 좌표로 분포시킨 저밀도 THREE.Points를 additive blending으로 얹어 깊이감을 더합니다. 오브젝트보다 느리게 회전해 패럴랙스를 만듭니다.',
        file: 'apps/lusion/webgl/CoreScene.ts',
      },
    ],
  },
  {
    slug: 'madar',
    title: 'VECTOR',
    titleKo: '벡터 — 경로(path) 3D 스크롤 카메라',
    tagline: '경로 3D 모티프 · 스크롤 연동 카메라 돌리 · 둥근 모서리·블러 카드 · 숫자 카운트업',
    original: { name: 'Madar 물류 플랫폼 웹사이트 (Vide Infra)', url: 'https://madarplatform.com/en' },
    year: '2026.07',
    stack: ['Nuxt 3', 'Three.js', 'Custom GLSL', 'GSAP ScrollTrigger'],
    accent: '#ff6340',
    thumb: 'thumbs/madar.png',
    summary:
      'Vide Infra가 만든 물류 플랫폼 Madar의 웹사이트(Awwwards·CSSDA·FWA Site of the Day)를 따라 만든 네 번째 학습 클론입니다. 네이비→코럴로 그라디언트하는 3D 경로(path)가 페이지 전체를 관통하고, 스크롤 진행도가 곧 경로 위 카메라의 위치가 되어 마치 드론이 물류 노선을 따라가듯 화면이 흘러갑니다. 각 정류장(웨이포인트)은 해당 섹션이 화면에 들어올 때 밝게 펄스합니다. 콘텐츠는 가상의 물류 플랫폼 "VECTOR"로 자체 제작했습니다.',
    techniques: [
      {
        name: '경로(path) 3D 모티프 + 스크롤 카메라 돌리',
        how: 'CatmullRomCurve3로 웨이포인트를 잇는 튜브 지오메트리를 만들고, 문서 전체 높이에 건 마스터 ScrollTrigger의 진행도(0..1)를 카메라가 경로 위를 이동하는 위치(getPointAt)로 직접 매핑합니다. 카메라는 경로 중심선이 아니라 살짝 띄운 별도의 궤도를 따라가며 경로 자체를 바깥에서 내려다봅니다.',
        file: 'apps/madar/webgl/JourneyScene.ts',
      },
      {
        name: '네이비→코럴 그라디언트 + 이동하는 빛 파동',
        how: '튜브의 UV.x(경로 길이 방향)로 두 브랜드 컬러를 보간하고, 사인파 밝기 밴드가 시간에 따라 진행 방향으로 흘러 화물이 경로를 이동하는 느낌을 만듭니다. 카메라가 위치한 구간은 별도로 더 밝혀 "지금 여기"를 표시합니다.',
        file: 'apps/madar/webgl/journeyShaders.ts',
      },
      {
        name: '웨이포인트 노드 발광 + 섹션 연동 펄스',
        how: '각 정류장에 core 메시와 BackSide additive 글로우 셸(lusion과 동일 기법)을 두고, 해당 섹션이 ScrollTrigger로 화면에 들어오면 그 노드만 GSAP으로 밝기·스케일을 펄스시켜 "도착했다"는 피드백을 줍니다.',
        file: 'apps/madar/webgl/JourneyScene.ts',
      },
      {
        name: '둥근 모서리 + 블러 카드(glassmorphism)',
        how: '반투명 배경에 backdrop-filter: blur()와 큰 border-radius를 적용한 `.glass` 유틸리티로 통계 패널을 유리처럼 표현합니다. Madar 원본의 시그니처인 "일관된 둥근 모서리·블러" 마이크로인터랙션을 재현했습니다.',
        file: 'apps/madar/components/StatsSection.vue',
      },
      {
        name: '숫자 카운트업',
        how: '통계 섹션 진입 시 GSAP proxy 객체를 0에서 목표값으로 트윈하며 매 프레임 텍스트를 갱신해 숫자가 올라가는 연출을 만듭니다.',
        file: 'apps/madar/components/StatsSection.vue',
      },
    ],
  },
  {
    slug: 'virya',
    title: 'AEOLIA',
    titleKo: '에올리아 — 클립패스 아이리스 리빌과 SVG 일러스트',
    tagline: '클립패스 히어로 리빌 · 무한 회전 SVG 일러스트 · 원형 게이지 차트 · 스크롤 타임라인',
    original: { name: 'Virya Energy 풍력 에너지 웹사이트 (Studio Ruelle)', url: 'https://virya-energy.com/our-expertise/wind-energy/' },
    year: '2026.07',
    stack: ['Nuxt 3', 'GSAP ScrollTrigger', 'SVG', 'CSS clip-path'],
    accent: '#1f7a5c',
    thumb: 'thumbs/virya.png',
    summary:
      'Studio Ruelle가 만든 풍력 에너지 기업 Virya Energy의 웹사이트(Awwwards Honorable Mention)를 따라 만든 다섯 번째 학습 클론입니다. 작은 원형 창문이 스크롤에 맞춰 화면 전체로 열리며 풍력 발전 풍경을 드러내는 히어로로 시작해, 손으로 그린 터빈 일러스트와 원형 게이지 통계, 스크롤로 그려지는 타임라인까지 이어집니다. 다른 라이브러리와 달리 WebGL 없이 순수 SVG/DOM과 GSAP만으로 구현했습니다. 콘텐츠는 가상의 풍력 에너지 기업 "AEOLIA"로 자체 제작했습니다.',
    techniques: [
      {
        name: '클립패스 아이리스 히어로 리빌',
        how: '섹션을 ScrollTrigger로 pin한 채 `clip-path: circle()`의 반지름을 9%→85%로 스크럽합니다. 작은 창문이 카메라 조리개처럼 열리며 뒤에 있던 장면이 점점 드러나고, 절반쯤 열렸을 때 헤드라인이 함께 페이드인합니다.',
        file: 'apps/virya/components/HeroWindow.vue',
      },
      {
        name: 'SVG 터빈 일러스트(무한 회전 + draw-on)',
        how: '블레이드 `<g>`는 CSS keyframes로 항상 회전해 Lottie 루프 캐릭터 애니메이션과 같은 인상을 주고, 타워는 `stroke-dasharray`/`dashoffset`을 스크롤 진행도에 스크럽해 아래에서 위로 그려집니다.',
        file: 'apps/virya/components/TurbineIllustration.vue',
      },
      {
        name: '원형 게이지 데이터 시각화',
        how: 'SVG 원의 둘레만큼 `stroke-dasharray`를 주고 `dashoffset`을 목표 비율까지 GSAP으로 트윈해 도넛형 진행률 차트를 그리며, 중앙 숫자를 같은 타이밍으로 카운트업합니다.',
        file: 'apps/virya/components/GaugeStat.vue',
      },
      {
        name: '스크롤 연동 세로 타임라인',
        how: '세로선을 `scaleY(0)→1`로 스크럽하며 그리고, 각 마일스톤 항목은 화면에 들어올 때 개별 ScrollTrigger로 페이드+슬라이드인합니다.',
        file: 'apps/virya/components/TimelineSection.vue',
      },
    ],
  },
  {
    slug: 'monad',
    title: 'CONDUIT',
    titleKo: '컨듀잇 — 모션패스 파이프라인과 노이즈→시그널 모핑',
    tagline: 'SVG 모션패스 파티클 · 스크롤 핀 파이프라인 다이어그램 · 노이즈→시그널 스크럽 모핑',
    original: { name: 'Monad — 보안 데이터 파이프라인', url: 'https://www.monad.com/' },
    year: '2026.07',
    stack: ['Nuxt 3', 'GSAP ScrollTrigger', 'SVG'],
    accent: '#22d3ee',
    thumb: 'thumbs/monad.png',
    summary:
      '보안 데이터 파이프라인 플랫폼 Monad의 제품 컨셉("여러 보안 툴의 데이터를 수집·정규화·필터링·라우팅한다")을 스크롤리텔링 기법으로 직접 설계한 여섯 번째 학습 클론입니다. Monad는 알려진 수상 이력이나 문서화된 시그니처 기법이 없어, 원본의 정확한 구현을 재현하는 대신 "데이터 파이프라인"이라는 제품 컨셉 자체를 히어로의 모션패스 파티클 흐름, 스크롤 연동 파이프라인 단계 다이어그램, 노이즈→시그널 모핑으로 형상화했습니다. 다른 라이브러리와 달리 WebGL 없이 순수 SVG/DOM + GSAP만으로 구현했습니다. 콘텐츠는 가상의 보안 데이터 파이프라인 플랫폼 "CONDUIT"으로 자체 제작했습니다.',
    techniques: [
      {
        name: 'SVG 모션패스 파티클 플로우',
        how: '여러 소스 노드에서 중앙 파이프 노드로 이어지는 베지어 곡선 위를, `path.getTotalLength()`/`getPointAtLength()`로 매 프레임 위치를 계산한 파티클이 위상차를 두고 흐릅니다. 파이프를 통과한 뒤에는 노이즈색에서 시그널색으로 바뀝니다.',
        file: 'apps/monad/components/HeroFlow.vue',
      },
      {
        name: '스크롤 핀 파이프라인 단계 다이어그램',
        how: '섹션을 pin한 채, 가로 파이프 경로의 `stroke-dashoffset`을 스크롤 진행도로 스크럽해 채우고, 진행도에 따라 4단계(Collect/Normalize/Filter/Route) 노드와 설명 패널이 순차적으로 활성화·크로스페이드됩니다.',
        file: 'apps/monad/components/PipelineStages.vue',
      },
      {
        name: 'Noise → Signal 스크럽 모핑',
        how: '각 점에 무작위(noise) 좌표와 정렬된 그리드(signal) 좌표를 미리 계산해두고, ScrollTrigger 진행도로 두 좌표를 선형보간합니다. `color-mix()`로 색상도 노이즈색→시그널색으로 함께 전환됩니다.',
        file: 'apps/monad/components/NoiseToSignal.vue',
      },
    ],
  },
]

export function getLibrary(slug: string) {
  return libraries.find((l) => l.slug === slug)
}
