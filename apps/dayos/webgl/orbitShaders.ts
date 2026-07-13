/**
 * 오빗 링 셰이더 — Dayos의 "160개가 넘는 통합 툴이 하나의 AI 코어를 중심으로
 * 정렬된다"는 핵심 메시지를 3D 궤도로 형상화한다. 각 점(통합 아이콘)은
 * 반지름·기울기·시작 각도·속도를 attribute로 갖고, 정점 셰이더가 uTime으로
 * 매 프레임 궤도 위 위치를 직접 계산한다(CPU 루프 없이 GPU에서 전부 처리).
 * 링별로 스크롤 진행도에 따라 개별 opacity를 줘, 스크롤할수록 더 많은
 * 통합이 코어에 정렬되는 것처럼 순차적으로 나타난다.
 */

export const ringVertex = /* glsl */ `
attribute float aRadius;
attribute float aIncline;
attribute float aPhase;
attribute float aSpeed;
attribute float aRing;
attribute float aRandom;

uniform float uTime;
uniform float uPixelRatio;

varying float vRing;
varying float vRandom;

void main() {
  float angle = aPhase + uTime * aSpeed;
  float x = aRadius * cos(angle);
  float y = -aRadius * sin(angle) * sin(aIncline);
  float z = aRadius * sin(angle) * cos(aIncline);

  vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  // 카메라 거리 ~5.5 기준으로 정규화한 완만한 원근 감쇠 — dala에서 겪은 것처럼
  // 배율이 크면 점이 화면을 뒤덮으므로 작게 유지한다
  gl_PointSize = (8.0 + aRandom * 4.0) * uPixelRatio * (6.0 / -mvPosition.z);

  vRing = aRing;
  vRandom = aRandom;
}
`

export const ringFragment = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uOpacity0;
uniform float uOpacity1;
uniform float uOpacity2;

varying float vRing;
varying float vRandom;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  // 부드럽게 퍼지는 원형 점 하나 — 링(annulus)과 중심 점을 따로 합치려다
  // smoothstep 구간이 서로 겹쳐 과녁(bullseye) 모양이 되는 버그가 있어 단순화했다
  float shape = smoothstep(1.0, 0.3, d);
  if (shape <= 0.01) discard;

  float ringOpacity = vRing < 0.5 ? uOpacity0 : (vRing < 1.5 ? uOpacity1 : uOpacity2);
  float alpha = shape * ringOpacity * (0.6 + 0.4 * vRandom);
  gl_FragColor = vec4(uColor, alpha);
}
`

// AI 코어 글로우 셸 — lusion/madar와 동일한 프레넬 기반 저비용 bloom 기법
export const glowVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const glowFragment = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uGlow;

varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  vec3 viewDir = normalize(vViewPos);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.6);
  gl_FragColor = vec4(uColor, fresnel * 0.9 * uGlow);
}
`
