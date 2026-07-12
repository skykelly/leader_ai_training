/**
 * 파티클 셰이프 모프 셰이더 — Dala(Unseen Studio)의 시그니처인 "흩어진 점들이
 * 스크롤에 따라 전구, 다시 구체로 형태를 바꾸는" WebGL 파티클 시스템을 재현한다.
 * 세 목표 형태(카오스/전구/구체)의 정점을 모두 attribute로 올려두고, uMorph
 * 하나로 인접한 두 형태 사이를 GPU에서 직접 보간한다(CPU 루프 없이 저비용).
 * 색상도 같은 진행도로 회색(무질서)→호박색(통찰)→청백색(공유 지식) 순서로
 * 함께 보간되어, 형태와 의미가 같은 타이밍에 바뀐다.
 */

export const particleVertex = /* glsl */ `
attribute vec3 aPosB;
attribute vec3 aPosC;
attribute float aRandom;

uniform float uMorph; // 0..2 — 0=카오스, 1=전구, 2=구체
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;

varying float vRandom;
varying float vMorph;

void main() {
  vec3 pos;
  if (uMorph < 1.0) {
    pos = mix(position, aPosB, uMorph);
  } else {
    pos = mix(aPosB, aPosC, uMorph - 1.0);
  }

  // 살짝 살아있는 느낌을 주는 유기적 흔들림 — 형태가 굳어 보이지 않게
  pos += vec3(
    sin(uTime * 0.6 + aRandom * 30.0),
    cos(uTime * 0.5 + aRandom * 24.0),
    sin(uTime * 0.4 + aRandom * 18.0)
  ) * 0.012;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float breathe = 0.75 + 0.25 * sin(uTime * 1.4 + aRandom * 6.2831);
  // 카메라 거리 ~4.4 기준으로 정규화한 완만한 원근 감쇠 — 값이 커지면 화면 전체가
  // 점으로 뒤덮여 additive 블렌딩이 흰색으로 포화되므로 배율을 작게 유지한다
  gl_PointSize = uSize * breathe * uPixelRatio * (4.4 / -mvPosition.z);

  vRandom = aRandom;
  vMorph = uMorph;
}
`

export const particleFragment = /* glsl */ `
precision highp float;

uniform vec3 uColorChaos;
uniform vec3 uColorBulb;
uniform vec3 uColorGlobe;

varying float vRandom;
varying float vMorph;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float circle = smoothstep(1.0, 0.3, d);
  if (circle <= 0.001) discard;

  vec3 color;
  if (vMorph < 1.0) {
    color = mix(uColorChaos, uColorBulb, vMorph);
  } else {
    color = mix(uColorBulb, uColorGlobe, vMorph - 1.0);
  }

  float alpha = circle * (0.55 + 0.45 * vRandom);
  gl_FragColor = vec4(color, alpha);
}
`
