# starter — scrollkit 스크롤리텔링 템플릿

`packages/scrollkit`의 기법(WebGL 배경 3종, SplitText 리빌, 커스텀 커서, 마그네틱 버튼)을
조합해 새 사이트를 시작하는 최소 템플릿입니다.

## 새 사이트 만들기

```bash
cp -r apps/starter apps/<mysite>
# 1) apps/<mysite>/package.json — name과 dev 포트 수정
# 2) assets/styles/main.scss — 색/타이포 토큰 교체
# 3) pages/index.vue — 콘텐츠 교체
npm install          # 워크스페이스 링크 갱신
npm run dev --workspace apps/<mysite>
```

배포는 자동입니다 — `scripts/build-dist.sh`가 `apps/*`를 순회하므로
main 병합 시 `https://…/<mysite>/`로 배포됩니다.

## scrollkit에서 오는 것들

- `<ScrollCursor />` — 점+링 커스텀 커서(터치 기기 자동 비활성)
- `<ScrollMagneticButton to="...">` — 마그네틱 버튼
- `splitRevealTween(el, vars)` — 행 마스크 글자 리빌 (auto-import)
- WebGL 배경: `scrollkit/webgl/{FlowScene,WarpScene,OrbitScene}` —
  이 앱의 `components/StarterBackground.vue`가 사용 예시입니다
  (kind 전환, 테마 색, 스크롤 부스트/진행도, 터치 auto-wander, reduced-motion 폴백 포함)

## 페이지

- `/` — 히어로 + 기능 2개 + CTA (flow 배경)
- `/backgrounds` — 배경 3종 전환 데모

더 많은 기법(경로 카메라, 파티클 모프, 웨이브 전환 등)은
[`docs/TECHNIQUES.md`](../../docs/TECHNIQUES.md)에서 원본 위치를 찾아 포팅하세요.
