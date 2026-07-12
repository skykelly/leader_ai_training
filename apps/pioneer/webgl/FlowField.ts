import { snoise2D } from './noise'

const NOISE_FREQ = 0.9
const DRIFT_X = 0.05
const DRIFT_Y = 0.035
const ANGLE_SCALE = Math.PI * 3
const SPEED_MIN = 0.05
const SPEED_MAX = 0.14

/**
 * 흐름장(flow field) 파티클.
 * 각 점은 격자에 고정되지 않고, simplex noise가 만드는 각도장을 따라
 * 실제로 좌표가 이동한다 — noise(x,y,t)를 각도로 해석해 그 방향으로
 * 전진시키는 표준 flow field 기법. 화면 경계에 닿으면 반대편으로 랩어라운드된다.
 */
export class FlowField {
  readonly count: number
  readonly positions: Float32Array
  readonly randoms: Float32Array
  private speed: Float32Array

  constructor(count: number, ratio: number) {
    this.count = count
    this.positions = new Float32Array(count * 3)
    this.randoms = new Float32Array(count)
    this.speed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      this.positions[i * 3] = (Math.random() * 2 - 1) * ratio
      this.positions[i * 3 + 1] = Math.random() * 2 - 1
      this.positions[i * 3 + 2] = 0
      this.randoms[i] = Math.random()
      this.speed[i] = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)
    }
  }

  step(dt: number, time: number, ratio: number) {
    const pos = this.positions
    for (let i = 0; i < this.count; i++) {
      const ix = i * 3
      let x = pos[ix]
      let y = pos[ix + 1]

      const angle =
        snoise2D(x * NOISE_FREQ + time * DRIFT_X, y * NOISE_FREQ - time * DRIFT_Y) * ANGLE_SCALE
      x += Math.cos(angle) * this.speed[i] * dt
      y += Math.sin(angle) * this.speed[i] * dt

      if (x > ratio) x = -ratio
      else if (x < -ratio) x = ratio
      if (y > 1) y = -1
      else if (y < -1) y = 1

      pos[ix] = x
      pos[ix + 1] = y
    }
  }
}
