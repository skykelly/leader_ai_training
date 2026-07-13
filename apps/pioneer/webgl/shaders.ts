/**
 * Dot 필드 셰이더 — preparetopioneer.com 스타일의 인터랙티브 점 애니메이션.
 * 격자 형태로 배치된 점들이 simplex noise로 유기적으로 숨쉬듯 밝기·크기가
 * 요동치고, 커서 근처의 점은 밝아지며 살짝 밀려난다.
 */

export const dotVertex = /* glsl */ `
attribute float aRandom;
attribute float aFeature; // 얼굴 모드 전용: 그 점의 이목구비 굴곡량(부호 있음). flow 모드에서는 항상 0

varying float vGlow;
varying float vMix;

uniform float uTime;
uniform float uScroll;
uniform float uIntensity;
uniform vec2  uMouse;       // -1..1, lerp된 커서 위치
uniform vec2  uResolution;
uniform float uPixelRatio;
uniform float uBaseSize;
uniform float uDepthBoost; // 얼굴 모드에서 z(깊이)를 밝기/크기로 환산하는 계수
uniform float uFeatureBoost; // aFeature를 밝기로 환산하는 계수 — 정투영이라 정면에서는 z만으론 굴곡이 안 보여 별도로 강조한다
uniform float uMouseFx; // 커서 로컬 글로우/밀어내기 강도. flow=1, face=0(머리 회전이 반응을 대신함)
uniform float uBreathAmount; // 노이즈 기반 밝기 요동의 비중. face 모드는 낮춰 depth 대비가 묻히지 않게 한다
uniform vec2  uRippleCenter; // 클릭 리플 중심(물리 좌표, x는 ratio 배)
uniform float uRippleT; // 리플 진행도 0..1 — 0이면 비활성

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
  vec2 pos = position.xy; // 이미 물리적으로 정사각 비례가 되도록 JS에서 생성된 격자 좌표
  vec2 mouseP = vec2(uMouse.x * ratio, uMouse.y);
  float distToMouse = length(pos - mouseP);

  // 유기적인 "숨쉬기": 노이즈 위상에 점마다 랜덤 오프셋을 주어 파도치듯 밝기가 변한다
  float n = fbm(pos * 1.3 + vec2(uTime * 0.06, -uTime * 0.04) + uScroll * 2.2 + aRandom * 8.0);
  float mouseInfluence = smoothstep(0.45, 0.0, distToMouse) * uMouseFx;

  float pulse = 0.35 + 0.65 * (0.5 + 0.5 * sin(n * 3.0 + aRandom * 6.2831 + uTime * 0.6));
  float glow = mix(0.6, pulse, uBreathAmount) * uIntensity + mouseInfluence * 1.5;
  // 얼굴 모드에서는 position.z(회전 후 깊이)가 코·볼처럼 튀어나온 점을
  // 더 밝고 크게, 눈두덩처럼 꺼진 점을 더 어둡게 만든다. flow 모드는 z=0이라 영향 없음
  glow += position.z * uDepthBoost;
  // aFeature는 굴곡의 절대값(돌출·함몰 모두)을 밝기로 직접 끌어올린다 —
  // 정투영에서는 회전이 없는 정면일 때 z만으로는 이목구비가 거의 안 보이기 때문
  glow += abs(aFeature) * uFeatureBoost;
  // 클릭 리플: 클릭점에서 확산되는 충격파 링 — 링 위의 점은 밝아지며 바깥으로 밀려나고,
  // 퍼질수록 옅어진다. uRippleT=0이면 꺼짐.
  // smoothstep은 edge0 < edge1만 스펙 보장이라(역방향은 SwiftShader에서 0) 1.0-정방향 형태로 쓴다
  float rippleDist = distance(pos, uRippleCenter);
  float ring = (1.0 - smoothstep(0.0, 0.14, abs(rippleDist - uRippleT * 1.6)))
             * step(0.0005, uRippleT) * (1.0 - uRippleT);
  glow += 1.2 * ring;
  vGlow = clamp(glow, 0.0, 2.4);
  vMix = n;

  // 커서 주변 점은 살짝 밀려나 촉각적인 반응을 만든다
  vec2 pushDir = (pos - mouseP) / (distToMouse + 0.0001);
  vec2 displaced = pos + pushDir * mouseInfluence * 0.06;
  displaced += (pos - uRippleCenter) / max(0.001, rippleDist) * ring * 0.07;

  gl_Position = vec4(displaced.x / ratio, displaced.y, 0.0, 1.0);
  gl_PointSize = uBaseSize * (0.55 + vGlow * 0.85) * uPixelRatio;
}
`

export const dotFragment = /* glsl */ `
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
  float circle = smoothstep(1.0, 0.35, d);
  if (circle <= 0.001) discard;

  float m1 = 0.5 + 0.5 * sin(vMix * 3.0);
  vec3 color = mix(uColorA, uColorB, m1);
  color = mix(color, uColorC, smoothstep(0.25, 1.0, vGlow) * 0.55);

  float alpha = circle * clamp(vGlow * 0.75, 0.1, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`
