/**
 * 얼굴 파티클 셰이더 — preparetopioneer.com/experience의 구조를 따른다.
 *
 * 원본 구조(번들 분석으로 확인):
 *   - 파티클의 "초기 격자 위치 xy"가 그대로 얼굴 텍스처의 UV가 된다
 *   - depth 텍스처로 z를 밀어 입체를 만들고, albedo 색이 파티클 색이 된다
 *   - albedo의 밝기가 알파를 결정해(어두운 배경 = 투명) 얼굴 형태가 드러난다
 *   - 각 파티클은 수명(lifeSpan)을 돌며 페이드 인/아웃하고 초기 위치에서 재시작
 *   - 노이즈 바람장을 따라 천천히 흘러 흩어진다
 *
 * 원본은 transform feedback으로 파티클 상태를 GPU에 누적하지만, 여기서는
 * 상태 없이 시간만으로 위치를 계산한다(수명 위상 = fract). 결과는 동일하고
 * WebGL1에서도 돌며 CPU 갱신이 전혀 없다.
 *
 * 주의: GLSL smoothstep은 edge0 < edge1 정방향만 스펙 보장(역방향은
 * SwiftShader에서 0을 반환) — 모든 감쇠는 1.0 - smoothstep(...) 형태로 쓴다.
 */

export const faceParticleVertex = /* glsl */ `
attribute vec3 aInitialPos;   // 격자 초기 위치. xy는 그대로 텍스처 UV가 된다
attribute vec4 aSeed;         // 파티클별 난수 4채널

uniform float uTime;
uniform float uLifeSpan;          // 원본: 2~4초
uniform float uLifeSpanVariation; // 원본: 0.5
uniform float uParticleScale;     // 원본: 18~19
uniform float uScaleVariation;    // 원본: 0~5
uniform float uNoiseFrequency;    // 원본: 0.4
uniform float uNoiseIntensity;    // 원본: 0.015
uniform float uDepthScale;        // depth 텍스처 → z 변위 배율
uniform float uPixelRatio;
uniform float uYaw;
uniform float uPitch;
uniform float uExplosion;         // 결과 전환 시 확 흩어지는 연출
uniform sampler2D uFaceDepth;

varying vec2 vUv;
varying float vFade;
varying float vSeedY;
varying float vDepth;

// --- simplex noise (Ashima 3D) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// 발산이 0인 흐름(curl noise) — 파티클이 뭉치지 않고 유체처럼 감돈다
vec3 curl(vec3 p) {
  const float e = 0.12;
  float x1 = snoise(p + vec3(0.0, e, 0.0)) - snoise(p - vec3(0.0, e, 0.0));
  float x2 = snoise(p + vec3(0.0, 0.0, e)) - snoise(p - vec3(0.0, 0.0, e));
  float y1 = snoise(p + vec3(0.0, 0.0, e)) - snoise(p - vec3(0.0, 0.0, e));
  float y2 = snoise(p + vec3(e, 0.0, 0.0)) - snoise(p - vec3(e, 0.0, 0.0));
  float z1 = snoise(p + vec3(e, 0.0, 0.0)) - snoise(p - vec3(e, 0.0, 0.0));
  float z2 = snoise(p + vec3(0.0, e, 0.0)) - snoise(p - vec3(0.0, e, 0.0));
  return normalize(vec3(x1 - x2, y1 - y2, z1 - z2) / (2.0 * e));
}

void main() {
  // 초기 격자 위치의 xy가 곧 텍스처 좌표 (원본과 동일한 매핑)
  vec2 uv = aInitialPos.xy * 0.5 + 0.5;
  vUv = uv;
  vSeedY = aSeed.y;

  // 파티클마다 다른 수명·시작 위상 — 전체가 한꺼번에 깜빡이지 않게 한다
  float life = uLifeSpan * (1.0 - aSeed.z * uLifeSpanVariation);
  float phase = fract((uTime + aSeed.w * life) / life);

  // 원본의 수명 페이드: 나타났다가 사라지는 구간
  vFade = smoothstep(0.1, 0.25, phase) - smoothstep(0.7, 0.75, phase);

  // depth 텍스처로 z를 밀어 평면 격자를 얼굴 입체로 만든다
  float depth = texture2D(uFaceDepth, uv).r;
  vDepth = depth;
  vec3 pos = vec3(aInitialPos.xy, (depth - 0.5) * uDepthScale);

  // 바람장을 따라 수명 동안 누적 이동 — 얼굴에서 연기처럼 흘러나온다.
  // 이동량이 크면 형상이 뭉개지므로, 수명 후반부로 갈수록 서서히 풀리게 한다
  vec3 flow = curl(pos * uNoiseFrequency + vec3(0.0, 0.0, uTime * 0.08));
  pos += flow * uNoiseIntensity * phase * phase * life * 4.0;
  // 결과 전환 시 바깥으로 확 흩어지는 폭발
  pos += normalize(vec3(aSeed.xy - 0.5, aSeed.z)) * uExplosion * (0.4 + aSeed.y);

  // 커서를 따라가는 head tracking — 얼굴 전체를 회전시킨다
  float cy = cos(uYaw), sy = sin(uYaw);
  float cp = cos(uPitch), sp = sin(uPitch);
  pos = vec3(pos.x * cy + pos.z * sy, pos.y, -pos.x * sy + pos.z * cy);
  pos = vec3(pos.x, pos.y * cp - pos.z * sp, pos.y * sp + pos.z * cp);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // 원본과 동일하게 카메라 거리로 크기를 감쇠시킨다
  float size = uParticleScale + aSeed.x * uScaleVariation;
  gl_PointSize = size * uPixelRatio / max(0.2, -mvPosition.z);
}
`

export const faceParticleFragment = /* glsl */ `
precision highp float;

uniform sampler2D uFaceAlbedo;
uniform vec3 uMonoColor;      // 단색 틴트(팔레트 색)
uniform float uSpeechFactor;  // 0=단색, 1=원본 색
uniform float uOpacity;       // 원본: 0.75
uniform float uTime;

varying vec2 vUv;
varying float vFade;
varying float vSeedY;
varying float vDepth;

const float BORDER = 0.02;
const float DISC_RADIUS = 0.5;

void main() {
  // 원본과 같은 원형 디스크 + 중심 하이라이트
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float disc = 1.0 - smoothstep(DISC_RADIUS - BORDER, DISC_RADIUS + BORDER, d);
  if (disc <= 0.01) discard;

  vec3 faceColor = texture2D(uFaceAlbedo, vUv).rgb;
  // 클레이 렌더는 명암 폭이 좁아 그대로 쓰면 이목구비가 묻힌다.
  // 배경(거의 0)은 잘라내고 얼굴이 쓰는 좁은 밝기 구간을 0..1로 펴 대비를 넓힌다
  float raw = clamp(length(faceColor) / 1.732, 0.0, 1.0);
  float lum = smoothstep(0.05, 0.58, raw);

  // 앞으로 나온 부분(코·이마)을 밝게 — 정투영이 아니어도 입체가 더 읽힌다.
  // 과하면 코만 타버리므로 완만하게 준다
  float depthBoost = 0.72 + vDepth * 0.55;

  // 밝기를 단색 틴트에 실어 팔레트 톤으로 물들이고, speech에서 원래 색을 되살린다
  vec3 mono = lum * uMonoColor * 1.6;
  vec3 color = mix(mono, faceColor, uSpeechFactor) * depthBoost;
  color += pow(1.0 - min(1.0, d * 2.0), 3.0) * 0.35;
  color += (vSeedY - 0.5) * 0.08;

  // 원본: 얼굴 밝기가 곧 불투명도 — 배경(검정)은 자연히 사라진다
  float faceOpacity = lum * 0.85 + 0.15 * uSpeechFactor;
  float alpha = vFade * disc * faceOpacity * uOpacity * depthBoost;
  if (alpha < 0.02) discard;

  gl_FragColor = vec4(color, alpha);
}
`
