/**
 * 정면 얼굴 point cloud.
 * 외부 3D 모델 없이, 타원체(ellipsoid) 표면 위에 구조화된 위도/경도 격자를
 * 씌우고, 각 점을 표면의 실제 바깥 방향(법선)을 따라 밀거나 당겨 코·볼·
 * 입술·턱·눈두덩의 진짜 3D 굴곡을 만든다. 평평한 판에 z만 더하던 이전
 * 방식과 달리, 옆으로 갈수록 자연스럽게 깊이가 줄어들어 회전시키면
 * 실제 3/4 측면처럼 보인다.
 *
 * 정면(yaw=0)에서는 굴곡이 z(깊이)로만 나타나 정투영에서는 보이지 않으므로,
 * 이목구비의 굴곡량 자체를 별도 채널(features)로 저장해 밝기를 직접
 * 끌어올린다 — 얼굴 전체를 감싸는 완만한 타원체 깊이에 묻히지 않게 하기 위함.
 * 항상 살짝 옆을 보는 기본 자세를 둬 정면에서도 입체감이 드러나게 한다.
 */

// 타원체 반지름(가로/세로/깊이). RZ(깊이)가 실제 입체감을 만드는 핵심 축이다.
// 가로:세로 ≈ 1:2로 좁고 긴 실루엣. 아래 faceBump()의 좌표는 이전 튜닝
// 기준(RX0/RY0)에 맞춰져 있으므로 XS/YS로 비례 보정한다.
const RX0 = 0.42
const RY0 = 0.64
const RX = 0.32
const RY = 0.64
const RZ = 0.32
const XS = RX / RX0
const YS = RY / RY0
const AMP_SCALE = 0.5 // 굴곡 강도를 절반으로

// 격자가 감싸는 각도 범위 — theta: 좌우(경도), phi: 상하(위도, 0=정면 중심)
const THETA_MAX = 1.72 // rad, ±약 98.5°: 정면 + 관자놀이까지
const PHI_TOP = 1.32 // rad, 이마 위쪽
const PHI_BOTTOM = -1.28 // rad, 턱 아래쪽

const GRID_THETA = 108
const GRID_PHI = 118

const YAW_MAX = 0.55 // rad, 좌우로 바라볼 수 있는 최대 각도
const PITCH_MAX = 0.3 // rad, 위아래
const TURN_RATE = 2.2 // 목표 각도로 수렴하는 속도(클수록 빠르게 따라옴)
const IDLE_YAW = 0.16 // 마우스가 중앙에 있어도 완전한 정면이 되지 않도록 하는 기본 각도
const IDLE_PITCH = -0.05

function bump(x: number, y: number, cx: number, cy: number, sx: number, sy: number, amp: number): number {
  const dx = (x - cx) / sx
  const dy = (y - cy) / sy
  return amp * Math.exp(-(dx * dx + dy * dy))
}

/**
 * faceBump()의 좌표는 원래 튜닝 기준(RX0=0.42, RY0=0.64)으로 작성돼 있다.
 * 현재 RX/RY가 그 비율과 달라졌으므로 중심(cx,cy)·폭(sx,sy)을 XS/YS로,
 * 굴곡 강도는 AMP_SCALE로 보정해 얼굴 비율이 바뀌어도 이목구비가 항상
 * 제자리·적절한 세기로 나타나게 한다.
 */
function bumpB(x: number, y: number, cx: number, cy: number, sx: number, sy: number, amp: number): number {
  return bump(x, y, cx * XS, cy * YS, sx * XS, sy * YS, amp * AMP_SCALE)
}

/**
 * 이목구비 돌출량 — 타원체 표면의 (x,y) 위치를 얼굴 정면 좌표처럼 취급해
 * 가우시안 범프를 쌓는다. theta가 커질수록(관자놀이 쪽) 값이 자연히 0에
 * 가까워지므로 별도 마스킹 없이도 이목구비는 정면 부근에만 나타난다.
 */
function faceBump(x: number, y: number): number {
  let z = 0
  z += bumpB(x, y, 0, 0.05, 0.07, 0.21, 0.22) // 콧대
  z += bumpB(x, y, 0, -0.07, 0.052, 0.05, 0.19) // 코끝
  z += bumpB(x, y, 0.05, -0.115, 0.03, 0.026, 0.05) // 오른쪽 콧방울
  z += bumpB(x, y, -0.05, -0.115, 0.03, 0.026, 0.05) // 왼쪽 콧방울
  z += bumpB(x, y, 0.235, -0.03, 0.15, 0.17, 0.06) // 오른쪽 볼
  z += bumpB(x, y, -0.235, -0.03, 0.15, 0.17, 0.06) // 왼쪽 볼
  z += bumpB(x, y, 0.035, -0.25, 0.032, 0.02, 0.045) // 윗입술 오른쪽(큐피드 활)
  z += bumpB(x, y, -0.035, -0.25, 0.032, 0.02, 0.045) // 윗입술 왼쪽
  z += bumpB(x, y, 0, -0.3, 0.105, 0.032, 0.065) // 아랫입술
  z += bumpB(x, y, 0, -0.272, 0.115, 0.011, -0.035) // 입술 사이 골
  z += bumpB(x, y, 0, -0.175, 0.022, 0.032, -0.028) // 인중
  z += bumpB(x, y, 0, -0.43, 0.125, 0.095, 0.11) // 턱
  z += bumpB(x, y, 0.16, 0.06, 0.135, 0.1, -0.12) // 오른쪽 눈두덩(꺼짐)
  z += bumpB(x, y, -0.16, 0.06, 0.135, 0.1, -0.12) // 왼쪽 눈두덩(꺼짐)
  z += bumpB(x, y, 0.16, 0.135, 0.14, 0.03, 0.045) // 오른쪽 눈썹
  z += bumpB(x, y, -0.16, 0.135, 0.14, 0.03, 0.045) // 왼쪽 눈썹
  z += bumpB(x, y, 0, 0.3, 0.32, 0.09, 0.035) // 이마 능선
  return z
}

export class FaceCloud {
  readonly count: number
  readonly base: Float32Array
  readonly randoms: Float32Array
  /** 각 점의 이목구비 굴곡량(부호 있음) — 정면 정투영에서도 밝기로 입체를 드러내는 채널 */
  readonly features: Float32Array
  readonly positions: Float32Array

  private yaw = 0
  private pitch = 0
  private targetYaw = IDLE_YAW
  private targetPitch = IDLE_PITCH
  private idlePhase = Math.random() * Math.PI * 2

  constructor() {
    const pts: number[] = []
    const feats: number[] = []

    for (let gp = 0; gp <= GRID_PHI; gp++) {
      const v = gp / GRID_PHI
      const phi = PHI_TOP + (PHI_BOTTOM - PHI_TOP) * v
      // 위도 원의 반지름 — 위/아래로 갈수록 좁아져(정수리·턱) 자연스러운 두상 형태를 만든다
      const ring = Math.cos(phi)
      const y0 = RY * Math.sin(phi)

      for (let gt = 0; gt <= GRID_THETA; gt++) {
        const u = gt / GRID_THETA
        const theta = -THETA_MAX + THETA_MAX * 2 * u

        const x0 = RX * ring * Math.sin(theta)
        const z0 = RZ * ring * Math.cos(theta)

        // 타원체의 실제 바깥 법선(비등방 반지름 보정)
        const nx = x0 / (RX * RX)
        const ny = y0 / (RY * RY)
        const nz = z0 / (RZ * RZ)
        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
        const normX = nx / nLen
        const normY = ny / nLen
        const normZ = nz / nLen

        const amp = faceBump(x0, y0)

        // 격자가 너무 기계적으로 보이지 않도록 셀 크기 대비 작은 지터만 섞는다
        const jitter = (Math.random() - 0.5) * 0.0035

        pts.push(x0 + normX * amp + jitter, y0 + normY * amp + jitter, z0 + normZ * amp + jitter)
        feats.push(amp)
      }
    }

    this.count = pts.length / 3
    this.base = Float32Array.from(pts)
    this.features = Float32Array.from(feats)
    this.positions = new Float32Array(pts.length)
    this.randoms = new Float32Array(this.count)
    for (let i = 0; i < this.count; i++) this.randoms[i] = Math.random()
  }

  /** mx, my는 -1..1 범위의 커서 좌표(이미 lerp되어 부드러워진 값) */
  setTarget(mx: number, my: number) {
    // 회전 행렬을 직접 손으로 풀어 검증된 부호: yaw는 mx와 같은 부호,
    // pitch는 mx와 반대 부호여야 코(양의 z 돌출점)가 실제로 커서 쪽으로 이동한다.
    this.targetYaw = IDLE_YAW + mx * YAW_MAX
    this.targetPitch = IDLE_PITCH - my * PITCH_MAX
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
