/**
 * 얼굴 파티클 셰이더 — preparetopioneer.com/experience의 구조를 따른다.
 *
 * 원본 구조(번들 분석으로 확인):
 *   - 파티클의 "초기 위치 xy"가 그대로 얼굴 텍스처의 UV가 된다
 *   - depth 텍스처로 z를 밀어 입체를 만든다
 *   - 각 파티클은 수명(lifeSpan)을 돌며 페이드 인/아웃하고 초기 위치에서 재시작
 *   - 노이즈 바람장을 따라 천천히 흘러 흩어진다
 *
 * 텍스처는 3D 헤드 모델에서 구운 것이다(`scripts/bake-face-textures.mjs`):
 *   uFaceDepth  R=깊이(1=코), G=커버리지
 *   uFaceNormal 뷰 공간 법선
 * 이전에는 정면 렌더 한 장에서 깊이를 추정하고 그 깊이를 유한차분해 법선을
 * 근사했다. 이제 둘 다 계산된 값이라 relighting이 실제 조명이 된다.
 * 커버리지도 albedo 밝기 추정이 아니라 기하 정보다 — 어두운 이목구비가
 * 배경으로 분류돼 구멍이 나던 문제가 원천적으로 사라진다.
 *
 * 원본은 transform feedback으로 파티클 상태를 GPU에 누적하지만, 여기서는
 * 상태 없이 시간만으로 위치를 계산한다(수명 위상 = fract). 결과는 동일하고
 * WebGL1에서도 돌며 CPU 갱신이 전혀 없다.
 *
 * 주의: GLSL smoothstep은 edge0 < edge1 정방향만 스펙 보장(역방향은
 * SwiftShader에서 0을 반환) — 모든 감쇠는 1.0 - smoothstep(...) 형태로 쓴다.
 */

/** 동시에 살아 있을 수 있는 확산 링의 최대 개수 (GLSL 루프 상한이라 상수여야 한다) */
export const FACE_RINGS = 6

export const faceParticleVertex = /* glsl */ `
#define FACE_RINGS ${FACE_RINGS}
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
uniform float uTypeFactor;      // 출력 강도 0..1 — 문장이 찍히는 동안 얼굴이 진동한다
uniform float uTypePulse;       // 글자마다 튀는 순간 값
uniform float uRingT[FACE_RINGS]; // 각 확산 링의 탄생 시각(비활성은 큰 음수)
uniform float uRingLife;        // 링 수명(초)
uniform float uRingSpeed;       // 링이 퍼지는 속도(uv 거리/초)
uniform float uRingWidth;       // 링 마루의 두께
uniform sampler2D uFaceDepth;
uniform sampler2D uFaceNormal;

varying float vFade;
varying float vSeedY;
varying float vLight;
varying float vMask;
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
  // 초기 위치의 xy가 곧 텍스처 좌표 (원본과 동일한 매핑)
  vec2 uv = aInitialPos.xy * 0.5 + 0.5;
  vSeedY = aSeed.y;

  // 파티클마다 다른 수명·시작 위상 — 전체가 한꺼번에 깜빡이지 않게 한다
  float life = uLifeSpan * (1.0 - aSeed.z * uLifeSpanVariation);
  float phase = fract((uTime + aSeed.w * life) / life);

  // 원본의 수명 페이드: 나타났다가 사라지는 구간.
  // 창이 좁으면 절반 가까이가 항상 꺼져 있어 얼굴에 빈 구멍이 생긴다 —
  // 원본은 점이 고르게 깔린 격자로 읽히므로 가시 구간을 넓게 잡는다
  vFade = smoothstep(0.04, 0.14, phase) - smoothstep(0.86, 0.96, phase);

  // depth로 z를 밀어 평면 배치를 얼굴 입체로 만든다. G는 커버리지 —
  // "얼굴이 있는가"가 밝기 추정이 아니라 기하 정보로 온다
  vec4 dep = texture2D(uFaceDepth, uv);
  vMask = dep.g;
  vec3 pos = vec3(aInitialPos.xy, (dep.r - 0.5) * uDepthScale);

  // --- relighting ---
  // 모델에서 구운 실제 법선으로 다시 칠한다. 유한차분 근사였을 때는 뭉툭해서
  // 앰비언트를 크게 잡아 얼룩을 덮어야 했지만, 이제는 이목구비가 법선에
  // 제대로 담겨 있어 대비를 살려도 형태가 무너지지 않는다.
  vec3 nrm = normalize(texture2D(uFaceNormal, uv).rgb * 2.0 - 1.0);
  // 광원은 반드시 비스듬해야 한다. 정면광(0,0,1)이면 얼굴 앞면 전체에서
  // dot(n,L)이 1에 가까워 코·눈두덩·입술이 전부 같은 밝기로 뭉개진다 —
  // 법선이 아무리 정확해도 형태가 안 보인다.
  vec3 L = normalize(vec3(-0.55, 0.45, 0.70));
  // 하프 램버트: 그림자 쪽이 뚝 끊기지 않고 부드럽게 이어진다
  float hl = dot(nrm, L) * 0.5 + 0.5;
  float key = hl * hl;
  // 하프 램버트만으로는 그라디언트가 너무 매끄러워 콧대·눈두덩·입술 같은
  // 국소 굴곡이 묻힌다. 좁은 하이라이트를 하나 더 얹어 능선을 집어낸다
  float sheen = pow(key, 7.0);
  // 림은 아주 얕게만 — 세게 주면 얼굴이 테두리만 밝은 껍데기로 읽힌다
  float rim = pow(1.0 - clamp(nrm.z, 0.0, 1.0), 3.0);
  vLight = 0.32 + key * 0.60 + sheen * 0.38 + rim * 0.06;

  // --- 문장 출력 진동 ---
  // 단어마다 파문 하나가 얼굴 중심에서 태어나 바깥으로 퍼지며 잦아든다.
  //
  // 설계상 중요한 세 가지(각각 빠지면 "출렁임"으로 되돌아간다):
  //  1) 파형은 가우시안의 **미분**이다. 양의 봉우리(exp(-x²))만 쓰면 띠 안의 점이
  //     전부 같은 방향으로 부풀어 덩어리가 지나가는 모양이 된다. 미분형은 골과
  //     마루가 한 쌍이라 수면의 파문처럼 지나간 자리가 제자리로 돌아온다.
  //  2) 태어날 때 서서히 켜진다. 나이 0에서는 반지름도 0이라 얼굴 중앙 전체가
  //     한 점에 겹치는데, 거기서 최대 진폭이면 중앙이 통째로 튄다.
  //  3) 퍼질수록 진폭이 준다. 실제 파문도 원주가 커지는 만큼 에너지가 흩어진다.
  float distanceCenter = distance(uv, vec2(0.5));
  float ringWave = 0.0; // 부호 있는 변위 (골/마루)
  float ringGlow = 0.0; // 밝기·크기용 (절댓값 성분)
  for (int i = 0; i < FACE_RINGS; i++) {
    float age = uTime - uRingT[i];
    if (age < 0.0 || age > uRingLife) continue;
    float t = age / uRingLife;
    float radius = age * uRingSpeed;
    float x = (distanceCenter - radius) / uRingWidth;
    float bell = exp(-x * x);
    float birth = smoothstep(0.0, 0.16, t);          // 태어날 때 서서히
    float death = 1.0 - smoothstep(0.28, 1.0, t);    // 이른 시점부터 길게 잦아들며
    float spread = 1.0 / (1.0 + radius * 9.0);       // 퍼질수록 얕게
    float amp = birth * death * spread;
    ringWave += -2.0 * x * bell * amp;
    ringGlow += bell * amp;
  }

  // 점마다 위상을 흩어 한 덩어리로 출렁이지 않고 알갱이처럼 떨리게 한다
  float grain = sin(uTime * 12.0 + aSeed.x * 6.2831) * 0.5 + 0.5;
  float drive = uTypeFactor * (0.55 + uTypePulse * 0.45);
  // 링이 겹치면 합이 1을 훌쩍 넘어 색 전환이 얼굴 전체를 덮는다 — 상한을 둔다
  vTypeWave = min(ringGlow, 1.0);
  // 진동은 밝기가 아니라 "움직임"으로 읽혀야 한다 — 변위를 크게, 발광은 얕게.
  // 표면을 따라 바깥으로도 살짝 밀어 파문이 지나간 자리가 벌어졌다 모인다
  pos.z += ringWave * 0.085;
  pos.xy += normalize(aInitialPos.xy + 0.0001) * ringWave * 0.022;
  pos.xy += normalize(aInitialPos.xy + 0.0001) * (grain - 0.5) * drive * 0.018;

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

  // 원본과 동일하게 카메라 거리로 크기를 감쇠시킨다.
  // 출력 중에는 파동에 맞춰 알갱이가 커졌다 작아지며 반짝인다.
  // 계수를 크게 잡으면(0.5 이상) additive 겹침이 폭증해 얼굴이 마젠타로 타버린다 —
  // 원본 영상은 채널 포화가 1% 미만이므로 크기 변조는 얕게 준다
  float size = (uParticleScale + aSeed.x * uScaleVariation) * (1.0 + vTypeWave * 0.18);
  gl_PointSize = size * uPixelRatio / max(0.2, -mvPosition.z);
}
`

export const faceParticleFragment = /* glsl */ `
precision highp float;

uniform vec3 uMonoColor;    // 기본 틴트(진보라)
uniform vec3 uAccentColor;  // 밝은 쪽에 섞이는 그린
uniform vec3 uRingColor;    // 파문이 지나갈 때의 색
uniform float uGreenAmount; // 그린이 섞이는 최대 비율
uniform float uRingTint;    // 파문의 색 전환 강도
uniform float uOpacity;     // 원본: 0.75

varying float vFade;
varying float vSeedY;
varying float vLight;
varying float vMask;
varying float vTypeWave;

const float BORDER = 0.02;
const float DISC_RADIUS = 0.5;

void main() {
  // 원본과 같은 원형 디스크 + 중심 하이라이트
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float disc = 1.0 - smoothstep(DISC_RADIUS - BORDER, DISC_RADIUS + BORDER, d);
  if (disc <= 0.01) discard;

  // 밝기는 전부 relighting이 만든다 — 텍스처를 프래그먼트에서 다시 읽지 않는다.
  // 커버리지·조도는 정점에서 한 번 샘플링해 varying으로 넘어온다
  float lum = vMask * vLight;

  // 밝은 쪽일수록 그린이 섞인다. 전체를 균일하게 물들이지 않는 이유는,
  // 그림자 쪽에 보라가 남아야 명암이 색으로도 읽혀 입체가 살기 때문이다.
  float greenMix = smoothstep(0.40, 1.15, vLight) * uGreenAmount;
  vec3 tint = mix(uMonoColor, uAccentColor, greenMix);

  // 개별 파티클을 어둡게 두고 additive로 겹친 곳만 밝아지게 해야
  // 원본처럼 은은하게 깔린다
  vec3 color = lum * tint * 0.27;
  color += tint * pow(1.0 - min(1.0, d * 2.0), 3.0) * 0.05;
  color += (vSeedY - 0.5) * 0.03;

  // 파문이 지나가는 자리는 밝기뿐 아니라 **색**이 바뀐다 — 더하기만 하면
  // 이미 밝은 쪽에서 묻히지만, 색으로 갈아끼우면 어디를 지나는지 또렷하다
  color = mix(color, uRingColor * (0.45 + lum * 0.85), clamp(vTypeWave * uRingTint, 0.0, 0.82));

  // 얼굴 영역이면 고르게 보이도록 알파에 하한을 준다 — 밝기를 그대로 알파로
  // 쓰면 어두운 쪽이 통째로 사라져 형태에 구멍이 난다
  float faceOpacity = vMask * (0.84 + lum * 0.16);
  float alpha = vFade * disc * faceOpacity * uOpacity;
  if (alpha < 0.015) discard;

  gl_FragColor = vec4(color, alpha);
}
`
