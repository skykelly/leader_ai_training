/**
 * 경로(path) 셰이더 — Madar 웹사이트의 핵심 3D 모티프인 "경로" 튜브를 재현한다.
 * 원본 제작사(Vide Infra)에 따르면 이 경로는 세 가지 의미를 동시에 가진다:
 * 반복되는 그래픽 모티프, 물류(운송·경로)라는 제품 본질의 은유, 그리고 첫
 * 화면부터 결론까지 사용자를 이끄는 안내선. 여기서는 경로를 튜브 지오메트리로
 * 그리고, 길이(UV.x)를 따라 네이비→코럴로 그라디언트하며, 화물이 이동하는
 * 느낌을 주는 빛 파동을 흐르게 하고, 현재 스크롤 위치(카메라가 있는 지점)
 * 주변을 더 밝혀 "지금 여기"를 표시한다.
 */

export const tubeVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const tubeFragment = /* glsl */ `
precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  vec3 base = mix(uColorA, uColorB, vUv.x);

  vec3 viewDir = normalize(vViewPos);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.0);

  // 화물이 경로를 따라 흐르는 느낌의 이동하는 빛 파동(진행 방향: 원점→도착지)
  float wave = pow(0.5 + 0.5 * sin(vUv.x * 26.0 - uTime * 2.4), 10.0);

  // 카메라(스크롤 진행도)가 위치한 구간을 더 밝혀 "지금 여기"를 드러낸다
  float focus = smoothstep(0.22, 0.0, abs(vUv.x - uProgress));

  // 도로 대시 — 경로 길이 방향의 일정 간격 밝은 마디. 특정 UV.y 띠에만 넣으면
  // 그 면이 카메라 반대편을 향할 때 안 보이므로, 둘레 전체에 얹되 약하게 유지한다
  float dash = step(0.62, fract(vUv.x * 90.0));

  vec3 color = base * (0.5 + fresnel * 1.1) + vec3(1.0) * wave * 0.55 + base * focus * 0.9 + vec3(1.0) * dash * 0.13;
  gl_FragColor = vec4(color, 1.0);
}
`

// 경유지(waypoint) 노드 — core보다 살짝 큰 반투명 구를 뒷면만 그려(BackSide)
// additive로 겹쳐 발광하는 정류장처럼 보이게 한다 (lusion 글로우 셸과 동일 기법)
export const nodeGlowVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const nodeGlowFragment = /* glsl */ `
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
