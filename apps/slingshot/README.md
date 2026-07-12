# TACHYON — Sling Shot Intergalactic 학습 클론

필름 데일리즈(하루치 촬영 원본) 글로벌 전송 서비스 [Sling Shot Intergalactic](https://slingshotintergalactic.tv/)의
웹사이트(Awwwards Honorable Mention, 제작: Buzzworthy Studio)에서 "빛보다 빠른 전송"이라는 브랜드 약속을
시각화한 워프 스피드 연출을 학습해 만든 클론입니다. Scroll Study Library의 라이브러리 #8. 콘텐츠는
가상의 필름 데일리즈 전송 서비스 "TACHYON"으로 자체 제작했습니다.

> 이 실행 환경은 원본 사이트 직접 열람이 네트워크 정책상 차단되어 있어, 제작사(Buzzworthy Studio)의
> 케이스 스터디에서 확인한 알려진 디자인 시그니처(다크 배경, 이미지 디스토션, 떠다니는 3D 오브젝트,
> 오버사이즈 타이포, 강렬한 컬러 버스트, GSAP 스크롤 애니메이션)를 기반으로 재구성했습니다.

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| 워프 스피드 스트릭 | `webgl/WarpScene.ts` | 각 스트릭을 카메라를 향해 날아오는 짧은 선분(LineSegments)으로 그리고, 속도가 빨라질수록 선분 길이(trail)를 늘려 모션 블러처럼 보이게 합니다. |
| 스크롤 = 가속 페달 | `components/WarpCanvas.vue` | `ScrollTrigger.getVelocity()`로 실시간 스크롤 속도를 측정해 워프 강도로 매핑합니다 — 빠르게 스크롤할수록 화면이 가속하다 멈추면 서서히 순항 속도로 가라앉습니다. |
| 떠다니는 와이어프레임 오브젝트 | `webgl/WarpScene.ts` | 전송 중인 데이터 패킷의 은유로 이십면체·팔면체·사면체 와이어프레임을 배치하고, 각자 다른 속도로 자전·부유시킵니다. |
| 섹션 진입 부스트 펄스 | `components/FeatureSection.vue`, `webgl/WarpScene.ts` | 기능 섹션이 화면에 들어올 때 워프 속도를 짧게 최고조로 끌어올렸다 가라앉혀 "전송 순간"의 손맛을 줍니다. |
| 오버사이즈 타이포 | `assets/styles/main.scss` | 히어로 타이틀에 `clamp(3.2rem, 9.5vw, 8.6rem)`의 초대형 글자 크기와 대문자 트랜스폼을 적용해 브랜드의 강렬함을 형태로 드러냅니다. |
| 글자 단위 텍스트 리빌 | `composables/useSplitReveal.ts` | 다른 라이브러리와 동일한 SplitText 행 마스크 패턴 |

## 실행

```bash
npm run dev --workspace apps/slingshot   # http://localhost:3008
```
