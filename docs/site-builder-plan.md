# 스크롤리텔링 사이트 빌더 — 구현 계획

> 이전 계획(9개 클론 개선 6커밋)은 전부 main 병합·배포 완료(`e618b9a`…`d7394fe`, Actions success). 이 문서는 그 위에 얹는 **신규 기능** 계획이다.

## Context

사용자가 라이브러리에 축적된 스크롤리텔링 기법을 조합해 **자신의 웹사이트를 만들 수 있는 기능**을 요청했다. 확정된 방향(AskUserQuestion 답변):
- **형태: 웹 빌더** — 포털에 빌더 페이지를 추가. UI에서 섹션·기법·테마를 조합/편집하면 그 설정대로 렌더되는 사이트가 즉시 미리보기됨
- **콘텐츠: 미정** → 플레이스홀더 데모 콘텐츠를 기본값으로 제공
- **저장: localStorage 자동 저장** (+ JSON 내보내기/가져오기로 수동 공유)

핵심 설계 통찰: 9개 클론이 전부 "**전역 WebGL 배경 1개 + 스크롤되는 DOM 섹션들**" 구조다. 빌더도 같은 모델을 따른다 — 사용자는 배경 1종(flow/warp/orbit/없음)과 섹션 목록(히어로/기능/통계/타임라인/노이즈그리드/CTA)을 고르고 텍스트·색을 입력한다.

**제약**: SPA(ssr:false)·GitHub Pages 정적 호스팅 유지(서버 없음 — localStorage 방식과 부합). nuxt 3.20.2 고정. 신규 런타임 의존성은 **portal에 `three@^0.177` + `@types/three` 추가 1건만**(모노레포 타 앱에서 이미 사용 중인 버전).

## 데이터 모델 (`apps/portal/types/site.ts`)

```ts
export interface SiteTheme { bg: string; ink: string; accent: string; accent2: string }
export type BackgroundKind = 'none' | 'flow' | 'warp' | 'orbit'

export type Section =
  | { id: string; type: 'hero';     eyebrow: string; title: string; tagline: string }
  | { id: string; type: 'feature';  eyebrow: string; title: string; body: string; reverse: boolean }
  | { id: string; type: 'stats';    title: string; items: { label: string; value: number; suffix: string }[] }
  | { id: string; type: 'timeline'; title: string; items: { year: string; text: string }[] }
  | { id: string; type: 'noise';    eyebrow: string; title: string; body: string }
  | { id: string; type: 'cta';      title: string; body: string; button: string }

export interface SiteConfig {
  version: 1
  title: string
  theme: SiteTheme          // + THEME_PRESETS 6종(클론들의 팔레트 재활용: pioneer 보라, dayos 라임 등)
  background: BackgroundKind
  sections: Section[]
}
export const DEMO_CONFIG: SiteConfig  // 플레이스홀더 데모(히어로+기능2+통계+CTA)
```

## 상태 관리 (`apps/portal/composables/useSiteConfig.ts`)

싱글턴 composable(기존 useAura 패턴과 동일한 모듈 스코프 싱글턴):
- `config = ref<SiteConfig>` — 클라이언트에서 localStorage `scrollsite:config:v1` 로드(파싱 실패·버전 불일치 시 DEMO_CONFIG)
- `watch(config, debounce 500ms)` → localStorage 저장
- `addSection(type)/removeSection(id)/moveSection(id, dir)/reset()`
- `exportJson()`(Blob 다운로드) / `importJson(file)`(version 검증 후 교체)

## 파일 구조 (전부 `apps/portal/` 신규, 기존 파일 수정은 3곳)

```
types/site.ts                      — 위 모델 + DEMO_CONFIG + THEME_PRESETS
composables/useSiteConfig.ts
composables/useSplitReveal.ts      — 타 앱 8곳에 있는 동일 파일 복사(splitRevealTween)
webgl/noise.ts                     — pioneer/webgl/noise.ts 복사
webgl/FlowScene.ts + flowShaders.ts    — pioneer AuraScene의 flow 모드만 발췌(face/ripple 제거), 색 uniform을 테마에서 주입
webgl/WarpScene.ts + warpShaders.ts    — slingshot 포트(FOV 킥 포함, 부스트는 스크롤 velocity)
webgl/OrbitScene.ts + orbitShaders.ts  — dayos 포트(궤도선+빔 포함, progress는 페이지 전체 스크롤 진행도로 매핑)
components/builder/
  BuilderPanel.vue                 — 좌측 패널: 제목·테마 프리셋+색상 4개(input type=color)·배경 라디오·섹션 리스트(추가/삭제/↑↓/펼침 편집)
  SectionEditor.vue                — 섹션 타입별 필드 폼(텍스트/토글/항목 배열 편집)
  SitePreview.vue                  — config → 섹션 렌더. CSS 변수(--sb-bg/--sb-ink/--sb-accent/--sb-accent2)를 루트에 주입, gsap.context 스코프
  BackgroundCanvas.vue             — kind별 dynamic import로 씬 생성/dispose, 테마 색 전달, reduced-motion 시 정적 그라디언트 폴백, pointer:coarse 시 setAutoWander
  sections/SbHero.vue …/SbFeature.vue …/SbStats.vue …/SbTimeline.vue …/SbNoise.vue …/SbCta.vue
pages/builder.vue                  — 2패널 레이아웃. 우측 프리뷰는 자체 스크롤 컨테이너
pages/preview.vue                  — localStorage config를 풀스크린 렌더(새 탭 미리보기)
```

**수정 3곳**: `package.json`(three 추가), `pages/index.vue`(히어로 아래 "사이트 빌더" 진입 배너), `nuxt.config.ts`(변경 불필요 예상 — SPA 라우팅이라 OK, 확인만).

## 재사용 원본 매핑 (포트 출처)

| 빌더 요소 | 원본 |
|---|---|
| split 텍스트 리빌 | `apps/pioneer/composables/useSplitReveal.ts` |
| flow dot 배경 | `apps/pioneer/webgl/{FlowField,noise}.ts` + `AuraScene.ts`(flow 분기) + `shaders.ts` |
| warp 배경 | `apps/slingshot/webgl/WarpScene.ts` + shaders |
| orbit 배경 | `apps/dayos/webgl/OrbitScene.ts` + `orbitShaders.ts` |
| 카운트업 통계 | `apps/madar/components/StatsSection.vue` |
| 타임라인 | `apps/virya/components/TimelineSection.vue` |
| 노이즈→정렬 그리드 | `apps/monad/components/NoiseToSignal.vue` |
| 마그네틱 버튼(CTA) | `apps/pioneer/components/ui/MagneticButton.vue` |
| auto-wander(터치) | 이번 개선⑥에서 넣은 `setAutoWander` 패턴 그대로 |

## 구현상 핵심 주의점 (탐색으로 확인된 사항)

1. **스크롤 컨테이너**: 기존 씬·ScrollTrigger는 window 스크롤 기준. 빌더의 우측 프리뷰는 `overflow-y: auto` div이므로 `SitePreview`가 `scroller` prop을 받아 모든 `ScrollTrigger.create({ scroller })`에 전달. `/preview` 라우트에서는 생략(window).
2. **캔버스 크기**: 기존 씬은 `window.innerWidth/Height` + `position: fixed`. 포트 시 **컨테이너 요소 기준**으로 파라미터화(생성자에 host 요소 전달, ResizeObserver로 resize) — 빌더 분할 화면에서는 프리뷰 영역에 `position: sticky/absolute`로 깔림.
3. **config 반응성**: 섹션 추가/삭제/순서 변경 시 gsap.context revert 후 재구성(`watch` + `nextTick` + `ScrollTrigger.refresh()`). 텍스트 필드는 단순 바인딩이라 재구성 불필요.
4. **테마 색 → WebGL**: 씬에 `setColors(theme)` 메서드(기존 `setPalette` 패턴) — hex를 `THREE.Color`로 변환해 uniform lerp.
5. **SwiftShader 검증 제약**(이번 세션 교훈): GLSL smoothstep은 edge0<edge1 정방향만 사용. 검증 스크린샷은 `--use-gl=swiftshader` + `timeout: 60000`.

## 커밋 단위·실행 순서

| 커밋 | 내용 | 검증 게이트 |
|---|---|---|
| ① 빌더 코어 | types + useSiteConfig + builder/preview 페이지 + DOM 섹션 6종 + 패널 CRUD + 포털 홈 진입점 (배경은 'none'만) | 아래 검증 1–4, 6–7 |
| ② WebGL 배경 | three 의존성 + flow/warp/orbit 씬 포트 + BackgroundCanvas + 테마 색 연동 | 검증 5 |
| ③ 폴리시 | JSON 내보내기/가져오기, reduced-motion·모바일(auto-wander/오버플로), 통합 빌드 | 검증 8–10 |

각 커밋: feature 브랜치 `claude/scrollytelling-webpage-plan-qcob8k` push. **main 병합·배포는 완료 후 사용자 승인 받고** ff-merge → Actions success 확인.

## 검증 계획 (Playwright + pngjs, 기존 하네스 재사용)

1. `/builder` 로드: 콘솔 에러 0, DEMO_CONFIG 섹션 수만큼 프리뷰에 렌더 단언
2. 히어로 타이틀 입력 수정 → 프리뷰 h1 텍스트 즉시 반영 단언
3. 섹션 추가→삭제→순서 변경 → 프리뷰 섹션 개수·순서(data-type 속성) 단언
4. 테마 프리셋 클릭 → 프리뷰 루트의 CSS 변수 값 변경 단언
5. 배경 none→flow→warp→orbit 전환: 캔버스 존재 단언 + 각 배경에서 2프레임 diff>0(WebGL 구동 증거), 전환 시 콘솔 에러 0(dispose 누수 검증)
6. 편집 후 reload → localStorage 복원(수정한 타이틀 유지) 단언
7. `/preview` 라우트: 동일 config 풀스크린 렌더, 스크롤 시 stats 카운트업 값 증가 단언
8. JSON 내보내기 → 초기화 → 가져오기 라운드트립 후 config 일치
9. 모바일 에뮬레이션(390×844): 빌더는 패널 접힘 레이아웃, `/preview` 가로 오버플로 없음 + auto-wander 프레임 diff>0
10. 회귀: 포털 홈 필터·라이브러리 상세 정상, `npm run build` + `NUXT_APP_BASE_URL` generate 성공, 통합 `bash scripts/build-dist.sh` 성공
