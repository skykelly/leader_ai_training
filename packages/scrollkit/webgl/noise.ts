/**
 * 2D simplex noise — CPU(JS)용. GLSL 셰이더에서 쓰는 것과 동일한
 * Ashima 계열 알고리즘을 스칼라 연산으로 그대로 옮긴 것이다.
 * FlowField가 흐름 각도장을 계산할 때, FaceCloud가 미세한 흔들림을
 * 만들 때 공용으로 사용한다.
 */

function mod289(x: number): number {
  return x - Math.floor(x * (1 / 289)) * 289
}

function permute(x: number): number {
  return mod289((x * 34 + 1) * x)
}

function frac(x: number): number {
  return x - Math.floor(x)
}

const C0 = 0.211324865405187
const C1 = 0.366025403784439
const C2 = -0.577350269189626
const C3 = 0.024390243902439

export function snoise2D(vx: number, vy: number): number {
  const s = (vx + vy) * C1
  let ix = Math.floor(vx + s)
  let iy = Math.floor(vy + s)

  const t = (ix + iy) * C0
  const x0x = vx - ix + t
  const x0y = vy - iy + t

  const i1x = x0x > x0y ? 1 : 0
  const i1y = x0x > x0y ? 0 : 1

  const x12x = x0x + C0 - i1x
  const x12y = x0y + C0 - i1y
  const x12z = x0x + C2
  const x12w = x0y + C2

  ix = mod289(ix)
  iy = mod289(iy)

  const p0 = permute(permute(iy) + ix)
  const p1 = permute(permute(iy + i1y) + ix + i1x)
  const p2 = permute(permute(iy + 1) + ix + 1)

  let m0 = Math.max(0.5 - (x0x * x0x + x0y * x0y), 0)
  let m1 = Math.max(0.5 - (x12x * x12x + x12y * x12y), 0)
  let m2 = Math.max(0.5 - (x12z * x12z + x12w * x12w), 0)
  m0 *= m0
  m0 *= m0
  m1 *= m1
  m1 *= m1
  m2 *= m2
  m2 *= m2

  const gx0 = 2 * frac(p0 * C3) - 1
  const gx1 = 2 * frac(p1 * C3) - 1
  const gx2 = 2 * frac(p2 * C3) - 1

  const h0 = Math.abs(gx0) - 0.5
  const h1 = Math.abs(gx1) - 0.5
  const h2 = Math.abs(gx2) - 0.5

  const ox0 = Math.floor(gx0 + 0.5)
  const ox1 = Math.floor(gx1 + 0.5)
  const ox2 = Math.floor(gx2 + 0.5)

  const a00 = gx0 - ox0
  const a01 = gx1 - ox1
  const a02 = gx2 - ox2

  m0 *= 1.79284291400159 - 0.85373472095314 * (a00 * a00 + h0 * h0)
  m1 *= 1.79284291400159 - 0.85373472095314 * (a01 * a01 + h1 * h1)
  m2 *= 1.79284291400159 - 0.85373472095314 * (a02 * a02 + h2 * h2)

  const g0 = a00 * x0x + h0 * x0y
  const g1 = a01 * x12x + h1 * x12y
  const g2 = a02 * x12z + h2 * x12w

  return 130 * (m0 * g0 + m1 * g1 + m2 * g2)
}
