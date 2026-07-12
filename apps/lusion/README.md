# COGENT — Lusion(Devin AI) 학습 클론

[Lusion](https://lusion.co/)이 Cognition의 AI 소프트웨어 엔지니어 "Devin"을 위해 만든 웹사이트
([archive-devin-ai.lusion.co](https://archive-devin-ai.lusion.co))의 시그니처 기법을 따라 만든
학습 클론입니다. Scroll Study Library의 라이브러리 #3. 콘텐츠는 가상의 AI 코딩 에이전트
"COGENT"로 자체 제작했습니다.

> 이 실행 환경은 원본 사이트 직접 열람이 네트워크 정책상 차단되어 있어, Lusion 스튜디오의
> 알려진 기술적 시그니처(실시간 3D 셰이더 히어로, 프레넬 글로우, 스크롤 연동 카메라/색 연출)를
> 기반으로 재구성했습니다.

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| 노이즈 변위 발광 구체 | `webgl/coreShaders.ts` | IcosahedronGeometry 정점을 3D simplex noise로 법선 방향 변위, 프레넬 항으로 가장자리 발광 |
| 후처리 없는 bloom | `webgl/CoreScene.ts` | 더 큰 반투명 구를 BackSide + AdditiveBlending으로 겹쳐 저비용 글로우 |
| 스크롤 섹션 → 색/스케일 모핑 | `components/CapabilitySection.vue` | ScrollTrigger 진입 시 core/glow 색상과 그룹 스케일을 GSAP lerp |
| 마우스 패럴랙스 회전 | `webgl/CoreScene.ts` | 자동 회전 누적값 + 마우스 lerp 오프셋을 합성 |
| 별 필드 배경 | `webgl/CoreScene.ts` | 구면 좌표 분포 Points, additive blending, 느린 반대 방향 회전으로 패럴랙스 |
| 글자 단위 텍스트 리빌 | `composables/useSplitReveal.ts` | pioneer와 동일한 SplitText 행 마스크 패턴 |
| 커스텀 커서 + 마그네틱 버튼 | `components/AppCursor.vue`, `MagneticButton.vue` | pioneer 패턴 재사용 |

## 실행

```bash
npm run dev --workspace apps/lusion   # http://localhost:3003
```
