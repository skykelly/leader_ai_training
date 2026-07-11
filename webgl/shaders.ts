/**
 * 아우라 셰이더 — simplex noise 기반 domain warping으로
 * 무지갯빛(iridescent) 그라디언트 오브를 그린다.
 * 원본 사이트의 AstroGL 아우라를 프래그먼트 셰이더 하나로 재현한 것.
 */

export const auraVertex = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

export const auraFragment = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uScroll;      // 0..1 페이지 스크롤 진행도
uniform float uIntensity;   // 아우라 강도(퀴즈 선택 등에서 펄스)
uniform vec2  uMouse;       // -1..1 마우스 위치(lerp됨)
uniform vec2  uResolution;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uColorC;
uniform vec3  uBg;

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
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p = p * 2.1 + 13.7;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 st = uv - 0.5;
  st.x *= uResolution.x / uResolution.y;

  float t = uTime * 0.08;

  // 아우라 중심: 마우스를 살짝 따라오고, 스크롤에 따라 위로 흘러간다
  vec2 center = uMouse * 0.18 + vec2(0.0, -0.08 + uScroll * 0.25);
  float d = length(st - center);

  // domain warping: 노이즈 좌표를 노이즈로 다시 왜곡 → 유기적인 흐름
  vec2 q = vec2(fbm(st * 1.6 + t), fbm(st * 1.6 - t * 0.7 + 5.2));
  float n = fbm(st * 2.2 + q * 1.4 + uScroll * 2.0);

  // 오브 형태: 중심에서 멀어질수록 감쇠, 노이즈로 가장자리를 흔든다
  float orb = smoothstep(0.85 + n * 0.25, 0.0, d);
  orb = pow(orb, 1.6) * uIntensity;

  // 3색 iridescent 혼합
  float m1 = 0.5 + 0.5 * sin(n * 3.0 + t * 2.0);
  float m2 = 0.5 + 0.5 * sin(n * 5.0 - t * 1.4 + d * 4.0);
  vec3 aura = mix(uColorA, uColorB, m1);
  aura = mix(aura, uColorC, m2 * 0.6);

  vec3 color = uBg + aura * orb;

  // 은은한 별(스파클) — 고주파 노이즈 임계값
  float star = smoothstep(0.985, 1.0, snoise(st * 60.0 + t * 0.5));
  color += star * 0.35 * (1.0 - orb);

  // 비네트 + 필름 그레인
  color *= 1.0 - dot(st, st) * 0.45;
  float grain = fract(sin(dot(uv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.03;

  gl_FragColor = vec4(color, 1.0);
}
`
