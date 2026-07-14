/**
 * Flow dot 필드 셰이더 — pioneer의 dot 셰이더에서 flow 모드만 추출한 범용판.
 * (face 모드 attribute/uniform과 클릭 리플 항은 제거, 커서 글로우/밀어내기는 유지)
 * 주의: smoothstep은 edge0 < edge1 정방향만 스펙 보장(역방향은 SwiftShader에서 0).
 */

export const flowVertex = /* glsl */ `
attribute float aRandom;

varying float vGlow;
varying float vMix;

uniform float uTime;
uniform float uIntensity;
uniform float uBoost;      // 스크롤 속도 부스트 — 숨쉬기 위상을 가속
uniform vec2  uMouse;      // -1..1, lerp된 커서 위치
uniform vec2  uResolution;
uniform float uPixelRatio;
uniform float uBaseSize;

// --- simplex noise (Ashima / IQ 계열 표준 구현) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = p * 2.1 + 13.7;
    a *= 0.5;
  }
  return v;
}

void main() {
  float ratio = uResolution.x / uResolution.y;
  vec2 pos = position.xy; // JS에서 물리 비례(x∈[-ratio,ratio], y∈[-1,1])로 생성된 좌표
  vec2 mouseP = vec2(uMouse.x * ratio, uMouse.y);
  float distToMouse = length(pos - mouseP);

  // 유기적인 "숨쉬기": 노이즈 위상에 점마다 랜덤 오프셋을 주어 파도치듯 밝기가 변한다
  float n = fbm(pos * 1.3 + vec2(uTime * 0.06, -uTime * 0.04) + aRandom * 8.0);
  float mouseInfluence = 1.0 - smoothstep(0.0, 0.45, distToMouse);

  float pulse = 0.35 + 0.65 * (0.5 + 0.5 * sin(n * 3.0 + aRandom * 6.2831 + uTime * (0.6 + uBoost)));
  float glow = pulse * uIntensity + mouseInfluence * 1.5;
  vGlow = clamp(glow, 0.0, 2.4);
  vMix = n;

  // 커서 주변 점은 살짝 밀려나 촉각적인 반응을 만든다
  vec2 pushDir = (pos - mouseP) / (distToMouse + 0.0001);
  vec2 displaced = pos + pushDir * mouseInfluence * 0.06;

  gl_Position = vec4(displaced.x / ratio, displaced.y, 0.0, 1.0);
  gl_PointSize = uBaseSize * (0.55 + vGlow * 0.85) * uPixelRatio;
}
`

export const flowFragment = /* glsl */ `
precision highp float;

varying float vGlow;
varying float vMix;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

void main() {
  // 정사각 포인트를 부드러운 원으로 마스킹
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float circle = 1.0 - smoothstep(0.35, 1.0, d);
  if (circle <= 0.001) discard;

  float m1 = 0.5 + 0.5 * sin(vMix * 3.0);
  vec3 color = mix(uColorA, uColorB, m1);
  color = mix(color, uColorC, smoothstep(0.25, 1.0, vGlow) * 0.55);

  float alpha = circle * clamp(vGlow * 0.75, 0.1, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`
