# CLAUDE.md — 작업 가이드

스크롤리텔링 학습 클론 모노레포. 어워드 수상 사이트들의 인터랙션 기법을 앱 하나씩으로 재현하고,
포털이 전체를 색인한다. **이 리포는 "기법 창고"로도 쓰인다** — 새 웹사이트를 만들 때 여기의
구현을 참고/포팅한다. 기법별 위치·의존성·주의점은 [`docs/TECHNIQUES.md`](docs/TECHNIQUES.md)가
단일 참조점이다. 재사용 가능한 일반화 구현은 [`packages/scrollkit`](packages/scrollkit)에 있다.

## 명령

```bash
npm install                  # 루트에서 한 번 (npm workspaces)
npm run dev:<slug>           # 앱별 dev 서버 — 포트: portal 3002, pioneer 3000, waaark 3001,
                             # lusion 3003, madar 3004, virya 3005, monad 3006, dala 3007,
                             # slingshot 3008, dayos 3009
npm run build --workspace apps/<slug>     # 앱 단독 빌드
bash scripts/build-dist.sh   # 배포와 동일한 통합 빌드 → dist/ (portal=루트, 각 앱=/<slug>/)
```

- dev 서버가 떠 있으면 같은 앱의 `nuxt build`가 락 충돌로 실패한다 — 빌드 전에 dev 서버를 내릴 것.
- dev 서버 종료는 `pkill -f` 금지(자기 셸 cmdline에 매치되어 exit 144). PID로 죽인다:
  `for pid in $(ps aux | grep "nuxt dev" | grep -v grep | awk '{print $2}'); do kill $pid; done`

## 아키텍처 핵심

- **모든 클론의 공통 구조**: 전역 WebGL/SVG 배경 1개(fixed, 싱글턴) + 스크롤되는 DOM 섹션들.
- **싱글턴 composable 패턴**: 씬 접근은 `useAura/useCore/useJourney/useWarp/useOrbit` 형태 —
  모듈 스코프에 scene 인스턴스, `init(canvas)`가 dynamic import로 생성, 씬 생성 전 호출은
  pending 값으로 저장했다가 init 시 재생(replay). 새 씬을 만들면 이 패턴을 따를 것.
- **배포**: main push → `.github/workflows/deploy.yml` → `build-dist.sh` → GitHub Pages.
  base path는 빌드 시 `NUXT_APP_BASE_URL`로 주입 — 로컬 dev는 항상 `/` 기준.
  `apps/*`를 자동 순회하므로 새 앱 추가 시 워크플로우 수정 불필요.
- 전 앱 `ssr: false` SPA. 서버 코드 없음(정적 호스팅 전제).

## 하드 제약

- **nuxt은 3.20.2 고정** — 3.21.8의 `ssr:false` dev 서버 버그(`No entry found in rollupOptions.input`) 회피.
- **런타임 의존성 추가 금지**(기존 스택으로 구현): three ^0.177, gsap ^3.13(ScrollTrigger/SplitText/Observer),
  lenis(pioneer만), sass, pretendard, @fontsource-variable/space-grotesk.
- 폰트는 반드시 `pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css`
  (2MB 단일 woff2 버전 금지 — 서브셋으로 84% 절감한 상태).
- git: feature 브랜치에 커밋/푸시. **main 병합·배포는 사용자 승인 후에만** ff-merge.

## 검증 하네스 (필수)

모든 기능 작업은 정량 검증을 통과해야 커밋한다. 패턴:

```js
import { chromium } from 'playwright-core'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',   // playwright install 금지 (사전 설치됨)
  args: ['--use-gl=swiftshader'],                // 헤드리스 WebGL
})
await page.screenshot({ path, timeout: 60000 })  // SwiftShader는 캡처가 느리다
```

- 픽셀 정량 비교는 `pngjs` diff (움직이는 씬은 "동결" 후 비교 — 씬의 흐름/숨쉬기를 끄고 측정).
- 공통 기본 게이트: **콘솔 에러 0 + `npm run build` 성공**.
- 모바일 검증: `newContext({ viewport: {width:390,height:844}, hasTouch: true, isMobile: true })` —
  `.cursor-dot` 부재, 가로 오버플로 없음, auto-wander 프레임 diff>0.

## WebGL/GSAP 함정 (세션에서 검증된 것들)

- **GLSL `smoothstep`은 edge0 < edge1 정방향만** 쓸 것. 역방향(edge0>edge1)은 스펙 미정의로
  SwiftShader에서 0을 반환한다(실기기 GPU에서는 동작해서 검증에서만 터진다).
  `smoothstep(a, 0.0, x)` 대신 `1.0 - smoothstep(0.0, a, x)`.
- 기존 앱 씬들은 window 크기 + `position: fixed` 전제. 컨테이너 안에 넣으려면
  scrollkit의 컨테이너 파라미터화 버전을 쓰거나 ResizeObserver 기준으로 포팅할 것.
- `ScrollTrigger.getVelocity()`는 인스턴스 메서드다(정적 아님) — `onUpdate: (self) => self.getVelocity()`.
- ScrollTrigger를 window가 아닌 스크롤 컨테이너에서 쓰려면 `scroller` 옵션 필수.
- Playwright `mouse.click`은 포인터를 이동시킨다 — 마우스 추적 씬(head tracking 등)의
  회귀 검증에서 클릭 효과와 포인터 이동 효과를 구분할 것.
- 터치 기기 대응: 씬에 `setAutoWander(on)`(느린 리사주 궤적) + Canvas 컴포넌트에서
  `matchMedia('(pointer: coarse)')` 게이트 — 기존 5개 씬에 구현돼 있으니 복제.
- reduced-motion: 모든 Canvas 컴포넌트는 `prefers-reduced-motion` 시 정적 폴백 div를 렌더.

## 새 웹사이트 만들 때

1. [`docs/TECHNIQUES.md`](docs/TECHNIQUES.md)에서 필요한 기법과 원본 경로를 찾는다.
2. 공통 기법(배경 씬 3종, split 리빌, 커서, 마그네틱 버튼)은 `packages/scrollkit`에서 import.
3. `apps/starter/`를 복사해 새 앱으로 시작 (`cp -r apps/starter apps/<mysite>` 후
   package.json name/포트 수정, portal `libraries.ts` 등록은 선택).
4. scrollkit에 없는 기법은 원본 앱에서 파일 단위로 포팅 — TECHNIQUES.md의 주의점 확인.
