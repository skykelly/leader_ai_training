import * as THREE from 'three'
import gsap from 'gsap'
import { flowVertex, flowFragment } from './flowShaders'
import { FlowField } from './FlowField'

const ROWS = 36
const MAX_DOTS = 6000
const DEFAULT_COLORS = ['#8b5cf6', '#6366f1', '#e9d5ff']

export interface FlowSceneOptions {
  /** [colorA, colorB, colorC(글로우 하이라이트)] hex 3개 */
  colors?: string[]
  /** 크기 기준 요소. 생략 시 canvas의 부모 요소 */
  host?: HTMLElement
}

/**
 * 흐름장(flow field) dot 배경 — pioneer AuraScene의 flow 모드를 컨테이너
 * 파라미터화한 범용판. 점들이 simplex noise 각도장을 따라 실제로 이동하고,
 * 커서 근처는 밝아지며 밀려난다. window가 아니라 host 요소 크기를 따르므로
 * 풀스크린 배경과 분할 화면 프리뷰 양쪽에서 쓸 수 있다.
 */
export class FlowScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private material: THREE.ShaderMaterial
  private points: THREE.Points
  private geometry = new THREE.BufferGeometry()
  private flow: FlowField | null = null
  private host: HTMLElement

  private targetMouse = new THREE.Vector2(0, 0)
  private autoWander = false
  private boost = 0
  private targetBoost = 0

  private tickerFn: () => void
  private resizeObserver: ResizeObserver
  private onPointerMove: (e: PointerEvent) => void
  private resizeTimer: ReturnType<typeof setTimeout> | undefined
  private lastTime = 0

  constructor(canvas: HTMLCanvasElement, opts: FlowSceneOptions = {}) {
    this.host = opts.host ?? canvas.parentElement ?? document.body
    const [a, b, c] = [...(opts.colors ?? []), ...DEFAULT_COLORS].slice(0, 3)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.material = new THREE.ShaderMaterial({
      vertexShader: flowVertex,
      fragmentShader: flowFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uBoost: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uBaseSize: { value: 3.2 },
        uColorA: { value: new THREE.Color(a) },
        uColorB: { value: new THREE.Color(b) },
        uColorC: { value: new THREE.Color(c) },
      },
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)

    // host 크기를 따라간다 — window resize가 아니라 컨테이너 기준
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => this.resize(), 120)
    })
    this.resizeObserver.observe(this.host)
    this.onPointerMove = (e) => {
      this.targetMouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      )
    }
    window.addEventListener('pointermove', this.onPointerMove)
    this.resize()

    this.tickerFn = () => {
      const now = gsap.ticker.time
      const dt = Math.min(now - this.lastTime, 0.05)
      this.lastTime = now

      const u = this.material.uniforms
      u.uTime.value = now
      // 터치 기기에는 커서가 없으므로 느린 리사주 궤적이 시선 이동을 대신한다
      if (this.autoWander) this.targetMouse.set(Math.sin(now * 0.3) * 0.4, Math.cos(now * 0.23) * 0.25)
      ;(u.uMouse.value as THREE.Vector2).lerp(this.targetMouse, 0.08)

      // 스크롤 속도 부스트 — dt 배율로 흐름장이 실제로 빨라지고, 입력이 멎으면 가라앉는다
      this.boost += (this.targetBoost - this.boost) * Math.min(1, dt * 3)
      this.targetBoost += (0 - this.targetBoost) * Math.min(1, dt * 1.2)
      u.uBoost.value = this.boost

      const ratio = u.uResolution.value.x / u.uResolution.value.y
      if (this.flow) {
        this.flow.step(dt * (1 + this.boost * 2.5), now, ratio)
        const posAttr = this.geometry.attributes.position as THREE.BufferAttribute | undefined
        if (posAttr) posAttr.needsUpdate = true
      }

      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
  }

  /** 테마 색 전환 — [colorA, colorB, colorC] */
  setColors(colors: string[], duration = 1.2) {
    const u = this.material.uniforms
    const targets = [u.uColorA, u.uColorB, u.uColorC]
    colors.slice(0, 3).forEach((hex, i) => {
      const t = new THREE.Color(hex)
      gsap.to(targets[i].value as THREE.Color, { r: t.r, g: t.g, b: t.b, duration, overwrite: 'auto' })
    })
  }

  setIntensity(value: number, duration = 1.2) {
    gsap.to(this.material.uniforms.uIntensity, { value, duration, ease: 'power2.out', overwrite: 'auto' })
  }

  /** 스크롤 속도(정규화 0..1.5)를 흐름장 가속으로 반영 */
  setBoost(value: number) {
    this.targetBoost = Math.max(this.targetBoost, Math.min(1.5, value))
  }

  /** 터치 기기용: 커서 대신 자동 시선 순회를 켠다 */
  setAutoWander(on: boolean) {
    this.autoWander = on
  }

  private resize() {
    const w = this.host.clientWidth || 1
    const h = this.host.clientHeight || 1
    this.renderer.setSize(w, h)
    ;(this.material.uniforms.uResolution.value as THREE.Vector2).set(w, h)
    this.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
    // 점 개수·랩어라운드 경계가 비율에 의존하므로 리사이즈 때 필드를 다시 만든다
    const ratio = w / h
    const cols = Math.max(8, Math.round(ROWS * ratio))
    const count = Math.min(cols * ROWS, MAX_DOTS)
    this.flow = new FlowField(count, ratio)
    this.geometry.dispose()
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.flow.positions, 3))
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(this.flow.randoms, 1))
    this.points.geometry = this.geometry
  }

  dispose() {
    clearTimeout(this.resizeTimer)
    gsap.ticker.remove(this.tickerFn)
    this.resizeObserver.disconnect()
    window.removeEventListener('pointermove', this.onPointerMove)
    this.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
  }
}
