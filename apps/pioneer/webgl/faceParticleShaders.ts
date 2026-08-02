/**
 * 얼굴 윤곽 파티클 셰이더.
 *
 * 이목구비를 버리고 윤곽선(계란형 + V라인)만 남긴 구성이다. 형태는 CPU에서
 * 수식으로 계산해 파티클을 윤곽선 위에 직접 배치하므로(`contourShape.ts`)
 * 셰이더는 위치를 만들지 않고 **움직임만** 담당한다:
 *   - 수명 순환 페이드 (상태 없이 fract 위상으로)
 *   - 곡선을 따라 흐르는 접선 방향 드리프트
 *   - 타이핑에 맞춰 중심에서 퍼지는 파문
 *   - 커서를 따라가는 head tracking 회전
 *
 * 격자를 깔고 마스킹하는 방식이 아니므로 파티클이 버려지지 않는다.
 *
 * 주의: GLSL smoothstep은 edge0 < edge1 정방향만 스펙 보장(역방향은
 * SwiftShader에서 0을 반환) — 모든 감쇠는 1.0 - smoothstep(...) 형태로 쓴다.
 */

/** 동시에 살아 있을 수 있는 확산 링의 최대 개수 (GLSL 루프 상한이라 상수여야 한다) */
export const FACE_RINGS = 6

export const faceParticleVertex = /* glsl */ `
#define FACE_RINGS ${FACE_RINGS}
attribute vec3 aInitialPos;   // 윤곽선(또는 내부) 위의 기준 위치
attribute vec4 aSeed;         // 파티클별 난수 4채널
attribute vec2 aTangent;      // 그 지점의 윤곽선 접선 — 곡선을 따라 흐르는 데 쓴다
attribute float aKind;        // 0 = 윤곽선, 1 = 내부 헤이즈
attribute float aArc;         // 정수리(0) → 턱(1) 위치. 파문이 이 좌표를 타고 내려간다

uniform float uTime;
uniform float uLifeSpan;
uniform float uLifeSpanVariation;
uniform float uParticleScale;
uniform float uScaleVariation;
uniform float uNoiseFrequency;
uniform float uNoiseIntensity;
uniform float uFlowSpeed;         // 곡선을 따라 흐르는 속도
uniform float uPixelRatio;
uniform float uYaw;
uniform float uPitch;
uniform float uExplosion;
uniform float uTypeFactor;        // 출력 강도 0..1
uniform float uTypePulse;         // 글자마다 튀는 순간 값
uniform float uRingT[FACE_RINGS]; // 각 확산 링의 탄생 시각(비활성은 큰 음수)
uniform float uRingLife;
uniform float uRingSpeed;
uniform float uRingWidth;

varying float vFade;
varying float vSeedY;
varying float vKind;
varying float vTypeWave;

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
  vSeedY = aSeed.y;
  vKind = aKind;

  // 파티클마다 다른 수명·시작 위상 — 전체가 한꺼번에 깜빡이지 않게 한다
  float life = uLifeSpan * (1.0 - aSeed.z * uLifeSpanVariation);
  float phase = fract((uTime + aSeed.w * life) / life);
  vFade = smoothstep(0.05, 0.16, phase) - smoothstep(0.84, 0.95, phase);

  vec3 pos = aInitialPos;

  // 윤곽선을 따라 흐른다 — 접선 방향으로 미끄러지며 곡선이 살아 움직인다.
  // 방향은 씨드로 갈라 양쪽으로 흐르게 하고(한쪽으로 쓸리지 않게),
  // 변위는 누적이 아니라 sin으로 왕복시킨다 — 누적하면 수명 끝에 곡선을
  // 벗어난 자리에서 사라져 윤곽이 번진다.
  // aTangent에는 끝점 감쇠가 실려 있다(정수리·턱에서 0).
  float dir = aSeed.x > 0.5 ? 1.0 : -1.0;
  pos.xy += aTangent * dir * sin(phase * 3.14159) * uFlowSpeed * (0.6 + aSeed.y * 0.8);

  // --- 문장 출력 진동 ---
  // 단어마다 파문 하나가 정수리에서 태어나 양쪽 뺨을 타고 내려가 턱에서 만난다.
  //
  // 윤곽선만 남은 구성에서는 중심 기준 동심원이 성립하지 않는다 — 선 위의 점은
  // 중심에서 거의 같은 거리라 파문이 전체에 동시에 닿아 다시 출렁임이 된다.
  // 그래서 "퍼져나가는" 좌표를 반지름이 아니라 **선을 따라 잰 호길이**로 잡는다.
  // 설계상 중요한 세 가지(각각 빠지면 "출렁임"으로 되돌아간다):
  //  1) 파형은 가우시안의 **미분** — 양의 봉우리만 쓰면 띠 안의 점이 전부 같은
  //     방향으로 부풀어 덩어리가 지나가는 모양이 된다.
  //  2) 태어날 때 서서히 켜진다 — 나이 0에서는 반지름도 0이라 중앙이 통째로 튄다.
  //  3) 퍼질수록 진폭이 준다 — 원주가 커지는 만큼 에너지가 흩어진다.
  float travel = aArc;
  float ringWave = 0.0; // 부호 있는 변위 (골/마루)
  float ringGlow = 0.0; // 밝기·크기용
  for (int i = 0; i < FACE_RINGS; i++) {
    float age = uTime - uRingT[i];
    if (age < 0.0 || age > uRingLife) continue;
    float t = age / uRingLife;
    float radius = age * uRingSpeed;
    float x = (travel - radius) / uRingWidth;
    float bell = exp(-x * x);
    float birth = smoothstep(0.0, 0.16, t);
    float death = 1.0 - smoothstep(0.28, 1.0, t);
    float spread = 1.0 / (1.0 + radius * 9.0);
    float amp = birth * death * spread;
    ringWave += -2.0 * x * bell * amp;
    ringGlow += bell * amp;
  }
  vTypeWave = ringGlow;

  // 파문은 윤곽선의 법선 방향으로 민다 — 선이 안팎으로 물결친다
  vec2 outward = normalize(aInitialPos.xy + 0.0001);
  pos.z += ringWave * 0.085;
  pos.xy += outward * ringWave * 0.03;

  // 글자마다 튀는 미세 떨림
  float grain = sin(uTime * 12.0 + aSeed.x * 6.2831) * 0.5 + 0.5;
  float drive = uTypeFactor * (0.55 + uTypePulse * 0.45);
  pos.xy += outward * (grain - 0.5) * drive * 0.016;

  // 아주 얕은 바람장 — 선이 뭉개지지 않을 만큼만 준다
  vec3 flow = curl(aInitialPos * uNoiseFrequency + vec3(0.0, 0.0, uTime * 0.08));
  pos += flow * uNoiseIntensity * phase;

  // 결과 전환 시 바깥으로 확 흩어지는 폭발
  pos += normalize(vec3(aSeed.xy - 0.5, aSeed.z)) * uExplosion * (0.4 + aSeed.y);

  // 커서를 따라가는 head tracking — 윤곽 전체를 회전시킨다
  float cy = cos(uYaw), sy = sin(uYaw);
  float cp = cos(uPitch), sp = sin(uPitch);
  pos = vec3(pos.x * cy + pos.z * sy, pos.y, -pos.x * sy + pos.z * cy);
  pos = vec3(pos.x, pos.y * cp - pos.z * sp, pos.y * sp + pos.z * cp);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // 내부 헤이즈는 윤곽선보다 작게 — 선이 또렷하게 읽혀야 한다
  float kindScale = mix(1.0, 0.72, aKind);
  float size = (uParticleScale + aSeed.x * uScaleVariation) * kindScale * (1.0 + vTypeWave * 0.18);
  gl_PointSize = size * uPixelRatio / max(0.2, -mvPosition.z);
}
`

export const faceParticleFragment = /* glsl */ `
precision highp float;

uniform vec3 uMonoColor;   // 단색 틴트(팔레트 색)
uniform float uOpacity;
uniform float uHazeOpacity; // 내부 헤이즈의 상대 밝기

varying float vFade;
varying float vSeedY;
varying float vKind;
varying float vTypeWave;

const float BORDER = 0.02;
const float DISC_RADIUS = 0.5;

void main() {
  // 원형 디스크 + 중심 하이라이트
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float disc = 1.0 - smoothstep(DISC_RADIUS - BORDER, DISC_RADIUS + BORDER, d);
  if (disc <= 0.01) discard;

  // 개별 점은 어둡게 두고 additive로 겹친 곳만 밝아지게 한다 —
  // 그래야 윤곽선이 타지 않고 은은한 빛의 선으로 깔린다
  vec3 color = uMonoColor * 0.20;
  color += uMonoColor * pow(1.0 - min(1.0, d * 2.0), 3.0) * 0.05;
  color += (vSeedY - 0.5) * 0.03;
  // 파문의 마루에 있는 점이 밝아져 선을 따라 빛의 띠가 퍼져나간다
  color += uMonoColor * vTypeWave * 0.05;

  float alpha = vFade * disc * uOpacity * mix(1.0, uHazeOpacity, vKind);
  if (alpha < 0.012) discard;

  gl_FragColor = vec4(color, alpha);
}
`
