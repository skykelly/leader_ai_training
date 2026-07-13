# NEXUS — Dayos 학습 클론

[Times Two Design](https://timestwo.design/)가 멀티클라우드 AI 통합 플랫폼
[Dayos](https://www.dayos.com/)를 위해 만든 웹사이트(Awwwards Site of the Day)의
시그니처를 따라 만든 학습 클론입니다. Scroll Study Library의 라이브러리 #9. "160개가
넘는 업무 툴을 하나의 AI로 통합한다"는 원본의 핵심 메시지를, 통합 아이콘들이 AI 코어를
중심으로 도는 3D 오빗 링으로 형상화했습니다. 콘텐츠는 가상의 멀티클라우드 AI 통합 플랫폼
"NEXUS"로 자체 제작했습니다.

> 이 실행 환경은 원본 사이트 직접 열람이 네트워크 정책상 차단되어 있어, 검색으로 확인한
> Dayos의 알려진 디자인 시그니처(블랙·라이트그레이 미니멀 팔레트, Suisse Heavy/Condensed
> 오버사이즈 타이포, 3D·영상·패럴랙스 스토리텔링)를 기반으로 재구성했습니다.

## 기법 → 구현 매핑

| 기법 | 구현 위치 | 핵심 |
|---|---|---|
| 3D 오빗 링 | `webgl/OrbitScene.ts`, `webgl/orbitShaders.ts` | 통합 아이콘 노드를 하나의 Points로 묶고, 반지름·기울기·시작각·속도를 attribute로 실어 정점 셰이더가 매 프레임 궤도 위 위치를 직접 계산합니다(CPU 루프 없음). |
| 스크롤 연동 링 순차 리빌 + 카메라 돌리 | `components/OrbitCanvas.vue` | 히어로 스크롤 러너웨이(`#orbit-track`, sticky) 진행도를 안쪽 링부터 순서대로 나타나는 opacity와 카메라 z 위치(멀리→가까이)로 매핑합니다. |
| AI 코어 글로우 셸 | `webgl/orbitShaders.ts` | lusion·madar와 동일한 프레넬 기반 BackSide+Additive 글로우 기법으로 코어 발광을 저비용으로 표현합니다. |
| 오버사이즈 콘덴스드 타이포 | `assets/styles/main.scss` | 대문자 변환 + 음수 letter-spacing으로 Suisse Heavy/Condensed 느낌의 강한 타이포그래피를 재현합니다. |
| 글자 단위 텍스트 리빌 | `composables/useSplitReveal.ts` | 다른 라이브러리와 동일한 SplitText 행 마스크 패턴 |

## 실행

```bash
npm run dev --workspace apps/dayos   # http://localhost:3009
```
