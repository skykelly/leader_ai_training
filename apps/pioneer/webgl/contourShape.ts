/**
 * 얼굴 윤곽(계란형 + V라인) 형상 정의.
 *
 * 이목구비를 버리고 윤곽선만 남기므로 albedo/depth 텍스처가 필요 없다.
 * 형태를 수식으로 두면 해상도에 매이지 않고 곡선이 어디서나 매끄럽다.
 *
 * 정규화 좌표 q = (qx, a)에서 윤곽선은 rad(q) = 1인 곡선이다:
 *   rad = mix(원(√(qx²+a²)), 마름모(|qx|+|a|), 아래쪽 가중치)
 * 원만 쓰면 턱이 둥글고, 마름모를 섞을수록 변이 곧아지며 턱이 뾰족해진다(V라인).
 */

/** 얼굴 반폭·반높이 (씬 좌표) */
export const HALF_W = 0.58
export const HALF_H = 0.72

/** GLSL smoothstep과 같은 보간 */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** 턱 쪽에서 1, 광대 위로 0 — V라인 성형을 아래쪽에만 건다 */
function below(a: number) {
  return 1 - smoothstep(-0.78, -0.12, a)
}

/**
 * 턱 끝 라운딩. V라인은 "곧은 턱선"이지 "뾰족한 꼭짓점"이 아니다 —
 * 마름모를 끝까지 섞으면 방패꼴이 되어 얼굴로 읽히지 않는다.
 * 맨 아래(그리고 정수리)에서는 다시 원으로 되돌려 끝을 둥글게 마감한다.
 */
function tipRound(a: number) {
  return 1 - smoothstep(0.74, 0.99, Math.abs(a))
}

/** 계란형: 위가 넉넉하고 아래로 갈수록 좁아진다 */
function eggWidth(a: number) {
  return 1 + 0.13 * a
}

/** V라인: 아래쪽 폭을 좁힌다 */
function narrowWidth(a: number) {
  return 1 - 0.3 * below(a)
}

/** 정규화 좌표 → 씬 좌표 */
export function toScene(qx: number, a: number): [number, number] {
  return [qx * HALF_W * eggWidth(a) * narrowWidth(a), a * HALF_H]
}

/**
 * 방향 θ에서 윤곽선까지의 정규화 반지름.
 *
 * rad은 a에 의존하고 a는 다시 반지름에 의존하므로 엄밀히는 연립이다.
 * 한 번만 되먹임해도(원 위의 a로 가중치를 잡고 반지름을 구한 뒤 a를 갱신)
 * 시각적으로 충분히 수렴한다.
 */
export function contourPoint(theta: number): { x: number; y: number } {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  let a = s
  let qx = c
  for (let i = 0; i < 2; i++) {
    // 마름모를 너무 많이 섞으면 턱이 바늘처럼 뾰족해진다 —
    // V라인은 곧은 턱선이지 뾰족한 꼭짓점이 아니다
    const m = below(a) * tipRound(a) * 0.34
    // 원에서는 r=1, 마름모에서는 r=1/(|c|+|s|). 둘을 같은 비율로 섞는다
    const r = 1 / (1 - m + m * (Math.abs(c) + Math.abs(s)))
    qx = c * r
    a = s * r
  }
  const [x, y] = toScene(qx, a)
  return { x, y }
}

/** 내부 채움용 — 윤곽선을 rNorm(0~1) 비율로 축소한 지점 */
export function interiorPoint(theta: number, rNorm: number): { x: number; y: number } {
  const p = contourPoint(theta)
  return { x: p.x * rNorm, y: p.y * rNorm }
}

/**
 * 호길이 기준 θ 샘플러.
 *
 * θ를 균등하게 뽑으면 곡률이 큰 구간(정수리·턱)에 점이 뭉치고 옆면이 성겨진다 —
 * 선의 밝기가 위아래로 몰려 고르지 않다. 누적 호길이를 미리 재두고 그 역함수로
 * 뽑으면 곡선 전체에 균일하게 깔린다.
 */
export function makeArcSampler(steps = 720) {
  const thetas = new Float64Array(steps + 1)
  const cum = new Float64Array(steps + 1)
  let prev = contourPoint(0)
  cum[0] = 0
  thetas[0] = 0
  for (let i = 1; i <= steps; i++) {
    const th = (i / steps) * Math.PI * 2
    const p = contourPoint(th)
    cum[i] = cum[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y)
    thetas[i] = th
    prev = p
  }
  const total = cum[steps]!
  // 정수리(θ=π/2)에서 잰 누적 호길이 — 파문이 선을 따라 내려가는 좌표가 된다
  const crownIdx = Math.round((0.25) * steps)
  const crownS = cum[crownIdx]!

  const sample = (u: number) => {
    const target = u * total
    // 누적 배열은 단조 증가 — 이분 탐색으로 구간을 찾고 선형 보간한다
    let lo = 0
    let hi = steps
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cum[mid]! < target) lo = mid + 1
      else hi = mid
    }
    const i = Math.max(1, lo)
    const seg = cum[i]! - cum[i - 1]!
    const t = seg > 0 ? (target - cum[i - 1]!) / seg : 0
    return thetas[i - 1]! + (thetas[i]! - thetas[i - 1]!) * t
  }

  /**
   * 정수리에서 그 지점까지의 거리(0=정수리, 1=턱). 좌우 대칭이라 파문 하나가
   * 정수리에서 태어나 양쪽 뺨을 타고 내려가 턱에서 만난다.
   */
  const arcFromCrown = (theta: number) => {
    const wrapped = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const idx = Math.min(steps, Math.round((wrapped / (Math.PI * 2)) * steps))
    let d = Math.abs(cum[idx]! - crownS)
    if (d > total / 2) d = total - d
    return d / (total / 2)
  }

  return { sample, arcFromCrown }
}
