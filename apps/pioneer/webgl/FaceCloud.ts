import { snoise2D } from './noise'

/**
 * 정면 얼굴 point cloud.
 * 외부 3D 모델 없이, 타원 실루엣 안에서 격자 샘플링한 뒤 가우시안 범프를
 * 합성해 코·볼·입술·턱의 z(깊이)를 만든다. 각 셀은 simplex noise 밀도장과
 * 눈 영역 밀도 감쇠를 곱한 확률로 채택되어, 점이 성기게 흩뿌려진 노이즈
 * 텍스처가 되고 눈은 완전한 구멍이 아니라 "점이 드문 영역"으로 깊이를
 * 표현한다. 매 프레임 커서 방향으로 yaw/pitch를 lerp하며 회전시켜
 * "마우스를 바라보는" 느낌을 만든다.
 */

const RX = 0.5
const RY = 0.62

const YAW_MAX = 0.5 // rad, 좌우로 바라볼 수 있는 최대 각도
const PITCH_MAX = 0.32 // rad, 위아래
const TURN_RATE = 2.2 // 목표 각도로 수렴하는 속도(클수록 빠르게 따라옴)

// 낮춘 기본 격자 해상도 — 아래의 확률적 샘플링과 합쳐져 전체 밀도를 크게 낮춘다
const GRID_X = 54
const GRID_Y = 68

const BASE_KEEP_PROB = 0.8 // 전체 밀도를 한 번 더 낮추는 기본 채택 확률
const DENSITY_NOISE_SCALE = 3.4 // 밀도 노이즈 필드의 공간 주파수 — 클수록 자잘한 얼룩
const DENSITY_NOISE_MIN = 0.32 // 노이즈로 인한 최소 밀도 배율(0에 가까울수록 대비가 큼)
const DEPTH_NOISE_AMOUNT = 0.018 // 표면 z에 섞는 미세한 랜덤 요철

const EYE_RADIUS_X = 0.1
const EYE_RADIUS_Y = 0.062
const EYE_MIN_DENSITY = 0.22 // 눈 중심에서도 완전히 비우지 않고 이만큼은 남긴다
const EYE_FALLOFF = 1.7 // 이 배수 거리에서 밀도가 다시 1로 회복

function jawTaper(ny: number): number {
  return ny < -0.15 ? Math.max(0.55, 1 - (-ny - 0.15) * 0.6) : 1
}

function inFace(x: number, y: number): boolean {
  const nx = x / RX
  const ny = y / RY
  const t = jawTaper(ny)
  return (nx * nx) / (t * t) + ny * ny <= 1
}

function eyeDist(x: number, y: number, sign: 1 | -1): number {
  const dx = (x - sign * 0.19) / EYE_RADIUS_X
  const dy = (y - 0.08) / EYE_RADIUS_Y
  return Math.sqrt(dx * dx + dy * dy)
}

/** 눈에 가까울수록 낮아지는 밀도 배율(0..1) — 완전한 구멍이 아니라 성긴 영역을 만든다 */
function eyeDensity(x: number, y: number): number {
  const d = Math.min(eyeDist(x, y, 1), eyeDist(x, y, -1))
  const t = Math.min(1, d / EYE_FALLOFF)
  const smooth = t * t * (3 - 2 * t)
  return EYE_MIN_DENSITY + (1 - EYE_MIN_DENSITY) * smooth
}

/** simplex 노이즈 기반 밀도장(0..1) — 균일한 격자 대신 성긴/짙은 얼룩을 만든다 */
function noiseDensity(x: number, y: number): number {
  const n = snoise2D(x * DENSITY_NOISE_SCALE, y * DENSITY_NOISE_SCALE) // -1..1
  return DENSITY_NOISE_MIN + (1 - DENSITY_NOISE_MIN) * (n * 0.5 + 0.5)
}

function bump(x: number, y: number, cx: number, cy: number, sx: number, sy: number, amp: number): number {
  const dx = (x - cx) / sx
  const dy = (y - cy) / sy
  return amp * Math.exp(-(dx * dx + dy * dy))
}

/** 이목구비 깊이(z) — 값이 클수록 앞으로 튀어나온 것 */
function faceZ(x: number, y: number): number {
  const nx = x / RX
  const ny = y / RY
  let z = 0.05 * Math.max(0, 1 - (nx * nx + ny * ny)) // 전체 돔 곡률
  z += bump(x, y, 0, 0.02, 0.075, 0.24, 0.1) // 콧대
  z += bump(x, y, 0, -0.03, 0.055, 0.05, 0.045) // 코끝
  z += bump(x, y, 0.26, -0.05, 0.16, 0.17, 0.03) // 오른쪽 볼
  z += bump(x, y, -0.26, -0.05, 0.16, 0.17, 0.03) // 왼쪽 볼
  z += bump(x, y, 0, -0.29, 0.15, 0.045, 0.045) // 입술
  z += bump(x, y, 0, -0.43, 0.13, 0.09, 0.05) // 턱
  z += bump(x, y, 0.19, 0.07, 0.14, 0.1, -0.05) // 오른쪽 눈두덩(꺼짐)
  z += bump(x, y, -0.19, 0.07, 0.14, 0.1, -0.05) // 왼쪽 눈두덩(꺼짐)
  z += bump(x, y, 0, 0.32, 0.34, 0.1, 0.02) // 이마 능선
  return z
}

export class FaceCloud {
  readonly count: number
  readonly base: Float32Array
  readonly randoms: Float32Array
  readonly positions: Float32Array

  private yaw = 0
  private pitch = 0
  private targetYaw = 0
  private targetPitch = 0
  private idlePhase = Math.random() * Math.PI * 2

  constructor() {
    const pts: number[] = []
    const minX = -RX - 0.02
    const maxX = RX + 0.02
    const minY = -RY - 0.02
    const maxY = RY + 0.02
    const cellW = (maxX - minX) / GRID_X
    const cellH = (maxY - minY) / GRID_Y

    for (let gy = 0; gy < GRID_Y; gy++) {
      for (let gx = 0; gx < GRID_X; gx++) {
        const x = minX + (gx + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.85
        const y = minY + (gy + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.85
        if (!inFace(x, y)) continue

        const keep = BASE_KEEP_PROB * noiseDensity(x, y) * eyeDensity(x, y)
        if (Math.random() > keep) continue

        const z = faceZ(x, y) + (Math.random() - 0.5) * DEPTH_NOISE_AMOUNT
        pts.push(x, y, z)
      }
    }

    this.count = pts.length / 3
    this.base = Float32Array.from(pts)
    this.positions = new Float32Array(pts.length)
    this.randoms = new Float32Array(this.count)
    for (let i = 0; i < this.count; i++) this.randoms[i] = Math.random()
  }

  /** mx, my는 -1..1 범위의 커서 좌표(이미 lerp되어 부드러워진 값) */
  setTarget(mx: number, my: number) {
    // 부호는 실측(centroid 분석)으로 검증됨: 커서가 오른쪽/위로 갈수록
    // 얼굴이 그쪽을 바라보도록(코가 커서 쪽으로 이동하도록) 뒤집혀 있다
    this.targetYaw = -mx * YAW_MAX
    this.targetPitch = my * PITCH_MAX
  }

  step(dt: number, time: number, ratio: number) {
    const k = Math.min(1, dt * TURN_RATE)
    this.yaw += (this.targetYaw - this.yaw) * k
    this.pitch += (this.targetPitch - this.pitch) * k

    // 마우스가 멈춰 있어도 미세하게 살아있는 느낌을 주는 idle 흔들림
    const yaw = this.yaw + Math.sin(time * 0.35) * 0.015
    const pitch = this.pitch + Math.cos(time * 0.27) * 0.01

    const cy = Math.cos(yaw)
    const sy = Math.sin(yaw)
    const cx = Math.cos(pitch)
    const sx = Math.sin(pitch)

    const base = this.base
    const out = this.positions
    for (let i = 0; i < this.count; i++) {
      const ix = i * 3
      const x = base[ix]
      const y = base[ix + 1]
      const z = base[ix + 2]

      // yaw: Y축 회전 (좌우로 바라봄)
      const xr = x * cy + z * sy
      const zr = -x * sy + z * cy
      // pitch: X축 회전 (위아래로 바라봄)
      const yr = y * cx - zr * sx
      const zr2 = y * sx + zr * cx

      // x만 ratio를 곱해둔다 — 셰이더가 최종 단계에서 x를 ratio로 나누므로
      // 결과적으로 상쇄되어, 화면비에 관계없이 얼굴 비율이 일정하게 유지된다
      out[ix] = xr * ratio
      out[ix + 1] = yr
      out[ix + 2] = zr2
    }
  }
}
