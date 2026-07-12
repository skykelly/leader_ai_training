# Scroll Study Library — 스크롤리텔링 학습 클론 컬렉션

어워드 수상 사이트들의 스크롤리텔링·인터랙션 기법을 하나씩 따라 만드는 학습 클론 모노레포입니다.
메인 페이지는 각 라이브러리의 썸네일과 활용 기술을 설명하는 블로그 포털이고,
각 클론은 독립된 Nuxt 앱으로 서브패스에 배포됩니다.

**배포**: https://skykelly.github.io/leader_ai_training/

## 라이브러리

| # | 이름 | 원본 | 핵심 기법 | 경로 |
|---|---|---|---|---|
| 01 | Prepare to Pioneer | [preparetopioneer.com](https://preparetopioneer.com/) (DEPT) | WebGL dot 필드, Lenis+ScrollTrigger 핀/스크럽, SplitText 리빌, 규칙 기반 진단 플로우 | [`apps/pioneer`](apps/pioneer) → `/pioneer/` |
| 02 | Wave Study | [waaark.com](https://waaark.com/) | SVG 웨이브/리퀴드 전환(path 모핑), GSAP Observer 풀페이지 슬라이드, 일러스트 드로우온 | [`apps/waaark`](apps/waaark) → `/waaark/` |
| 03 | COGENT | [Lusion — Devin AI](https://archive-devin-ai.lusion.co) | 노이즈 변위 발광 구체(3D simplex), 후처리 없는 bloom(글로우 셸), 스크롤 연동 색/스케일 모핑 | [`apps/lusion`](apps/lusion) → `/lusion/` |

기법별 상세 설명은 포털의 라이브러리 상세 페이지(데이터 소스: [`apps/portal/data/libraries.ts`](apps/portal/data/libraries.ts))에 있습니다.

## 구조

```
apps/
├── portal/    # 메인 블로그 포털 (배포 루트)
├── pioneer/   # 라이브러리 #1
└── waaark/    # 라이브러리 #2
scripts/build-dist.sh   # 전체 앱 빌드 → dist/ 조립 (CI와 로컬 공용)
```

- npm workspaces 모노레포 — 루트에서 `npm install` 한 번으로 전체 설치
- 각 앱은 완전히 독립된 Nuxt 3 앱 (라이브러리마다 다른 스택 실험 가능)

## 실행

```bash
npm install
npm run dev:portal    # http://localhost:3002
npm run dev:pioneer   # http://localhost:3000
npm run dev:waaark    # http://localhost:3001

# 배포와 동일한 통합 빌드 (dist/ 생성)
bash scripts/build-dist.sh
```

## 배포

`main` 브랜치 push 시 `.github/workflows/deploy.yml`이 `scripts/build-dist.sh`로
모든 앱을 빌드해 GitHub Pages에 배포합니다. 포털이 루트, 각 클론이 `/<slug>/`를 차지합니다.
Nuxt의 `NUXT_APP_BASE_URL` 환경변수로 앱별 base path를 빌드 시점에 주입하므로
로컬 dev는 항상 `/` 기준으로 동작합니다.

## 새 라이브러리 추가하기

1. `apps/<slug>/` 에 독립 Nuxt 앱 생성 (`package.json`의 `generate` 스크립트 필수, dev 포트는 겹치지 않게)
2. `apps/portal/data/libraries.ts` 에 항목 추가 (제목, 원본, 스택, 기법 설명)
3. 대표 화면을 캡처해 `apps/portal/public/thumbs/<slug>.png` 로 저장
4. 끝 — 배포 워크플로우는 `apps/*`를 자동 순회하므로 수정 불필요

## 참고

- nuxt는 3.20.2로 고정 — 3.21.8의 `ssr: false` dev 서버 버그(`No entry found in rollupOptions.input`) 회피
- 모든 클론은 학습 목적으로 원본의 기법만 재현하며, 콘텐츠·브랜딩은 자체 제작입니다
