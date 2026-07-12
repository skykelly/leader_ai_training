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
]

export function getLibrary(slug: string) {
  return libraries.find((l) => l.slug === slug)
}
