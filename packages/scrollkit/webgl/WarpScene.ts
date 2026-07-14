import * as THREE from 'three'
import gsap from 'gsap'

const STREAK_COUNT = 900
const FAR_Z = -42
const NEAR_Z = 2.5
const DEFAULT_COLORS = ['#00f0ff', '#ff3df0', '#ffe14d']

export interface WarpSceneOptions {
  /** 스트릭/오브젝트에 순환 적용되는 네온 색 (1~3개) */
  colors?: string[]
  /** 크기 기준 요소. 생략 시 canvas의 부모 요소 */
  host?: HTMLElement
}

/**
 * 워프 스피드 스트릭 씬 — slingshot WarpScene의 컨테이너 파라미터화 범용판.
 * 각 스트릭은 카메라를 향해 날아오는 선분이고, setBoost로 워프가 빨라질수록
 * 선분이 길어지며 FOV가 벌어진다(하이퍼스페이스 점프의 고전적 속도감).
 */
export class WarpScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private lineMaterial: THREE.LineBasicMaterial
  private lineGeometry: THREE.BufferGeometry
  private positions: Float32Array
  private colorAttr: THREE.BufferAttribute
  private streakZ: Float32Array
  private streakSpeed: Float32Array
  private floaters: THREE.Mesh[] = []
  private host: HTMLElement

  private warp = 0.4
  private targetWarp = 0.4
  private targetMouse = new THREE.Vector2(0, 0)
  private autoWander = false
  private mouse = new THREE.Vector2(0, 0)

  private tickerFn: () => void
  private resizeObserver: ResizeObserver
  private onPointerMove: (e: PointerEvent) => void
  private lastTime = 0

  constructor(canvas: HTMLCanvasElement, opts: WarpSceneOptions = {}) {
    this.host = opts.host ?? canvas.parentElement ?? document.body
    const palette = (opts.colors?.length ? opts.colors : DEFAULT_COLORS).map((c) => new THREE.Color(c))

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    this.camera.position.set(0, 0, 0)

    // 스트릭 라인 — 정점 2개(뒤/앞)로 이루어진 선분 STREAK_COUNT개를 하나의 지오메트리로
    this.positions = new Float32Array(STREAK_COUNT * 2 * 3)
    this.streakZ = new Float32Array(STREAK_COUNT)
    this.streakSpeed = new Float32Array(STREAK_COUNT)
    const colors = new Float32Array(STREAK_COUNT * 2 * 3)

    for (let i = 0; i < STREAK_COUNT; i++) {
      this.streakZ[i] = THREE.MathUtils.randFloat(FAR_Z, NEAR_Z)
      this.streakSpeed[i] = THREE.MathUtils.randFloat(0.7, 1.4)
    }

    this.lineGeometry = new THREE.BufferGeometry()
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.colorAttr = new THREE.BufferAttribute(colors, 3)
    this.lineGeometry.setAttribute('color', this.colorAttr)
    this.applyPalette(palette)

    this.lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.scene.add(new THREE.LineSegments(this.lineGeometry, this.lineMaterial))
    this.assignStreakXY()

    // 떠다니는 와이어프레임 오브젝트 — 전송 중인 데이터 패킷의 은유
    const shapeGeos = [
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.TetrahedronGeometry(0.6, 0),
    ]
    for (let i = 0; i < 6; i++) {
      const geo = shapeGeos[i % shapeGeos.length]
      const mat = new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(
        THREE.MathUtils.randFloatSpread(6),
        THREE.MathUtils.randFloatSpread(3.6),
        THREE.MathUtils.randFloat(-16, -4),
      )
      mesh.userData.spin = new THREE.Vector3(THREE.MathUtils.randFloat(0.1, 0.4), THREE.MathUtils.randFloat(0.1, 0.4), 0)
      mesh.userData.driftPhase = Math.random() * Math.PI * 2
      this.scene.add(mesh)
      this.floaters.push(mesh)
    }

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.host)
    this.onPointerMove = (e) => {
      this.targetMouse.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
    }
    window.addEventListener('pointermove', this.onPointerMove)
    this.resize()

    this.tickerFn = () => {
      const now = gsap.ticker.time
      const dt = Math.min(now - this.lastTime, 0.05)
      this.lastTime = now

      // 터치 기기에는 커서가 없으므로 느린 리사주 궤적이 시선 이동을 대신한다
      if (this.autoWander) this.targetMouse.set(Math.sin(now * 0.3) * 0.4, Math.cos(now * 0.23) * 0.25)
      this.mouse.lerp(this.targetMouse, 0.05)
      this.warp += (this.targetWarp - this.warp) * Math.min(1, dt * 1.6)
      // 부스트가 없을 때는 서서히 기본 순항 속도로 되돌아온다
      this.targetWarp += (0.4 - this.targetWarp) * Math.min(1, dt * 0.6)

      // 워프가 빨라질수록 화각이 벌어지는 FOV 킥
      this.camera.fov = 60 + this.warp * 16
      this.camera.updateProjectionMatrix()

      const speedScale = 6 + this.warp * 26
      const trailScale = 0.4 + this.warp * 3.2

      for (let i = 0; i < STREAK_COUNT; i++) {
        this.streakZ[i] += dt * speedScale * this.streakSpeed[i]
        if (this.streakZ[i] > NEAR_Z) this.streakZ[i] = FAR_Z
        const ix = i * 2 * 3
        const z = this.streakZ[i]
        this.positions[ix + 2] = z
        this.positions[ix + 5] = z - trailScale * this.streakSpeed[i]
      }
      ;(this.lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true

      this.camera.position.x = this.mouse.x * 0.5
      this.camera.position.y = this.mouse.y * 0.3
      this.camera.lookAt(0, 0, -10)

      this.floaters.forEach((mesh) => {
        const spin = mesh.userData.spin as THREE.Vector3
        mesh.rotation.x += spin.x * dt
        mesh.rotation.y += spin.y * dt
        mesh.userData.driftPhase += dt * 0.3
        mesh.position.y += Math.sin(mesh.userData.driftPhase) * 0.0015
      })

      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
  }

  private applyPalette(palette: THREE.Color[]) {
    const arr = this.colorAttr.array as Float32Array
    for (let i = 0; i < STREAK_COUNT; i++) {
      const c = palette[i % palette.length]
      const ci = i * 2 * 3
      arr[ci] = c.r
      arr[ci + 1] = c.g
      arr[ci + 2] = c.b
      arr[ci + 3] = c.r
      arr[ci + 4] = c.g
      arr[ci + 5] = c.b
    }
    this.colorAttr.needsUpdate = true
  }

  private assignStreakXY() {
    for (let i = 0; i < STREAK_COUNT; i++) {
      const ix = i * 2 * 3
      const angle = Math.random() * Math.PI * 2
      const radius = Math.pow(Math.random(), 0.5) * 7
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      this.positions[ix] = x
      this.positions[ix + 1] = y
      this.positions[ix + 3] = x
      this.positions[ix + 4] = y
    }
  }

  /** 테마 색 전환 — 스트릭 vertex color와 와이어프레임 오브젝트 색을 교체 */
  setColors(colors: string[]) {
    const palette = (colors.length ? colors : DEFAULT_COLORS).map((c) => new THREE.Color(c))
    this.applyPalette(palette)
    this.floaters.forEach((m, i) => {
      ;(m.material as THREE.MeshBasicMaterial).color.copy(palette[i % palette.length])
    })
  }

  /** 스크롤량에 비례해 워프 속도를 끌어올린다(스크롤이 곧 가속 페달) */
  setBoost(value: number) {
    this.targetWarp = THREE.MathUtils.clamp(value, 0, 1.6)
  }

  /** 섹션 진입 시 짧게 확 가속했다 가라앉는 펄스 */
  pulse() {
    this.targetWarp = Math.max(this.targetWarp, 1.4)
  }

  /** 터치 기기용: 커서 대신 자동 시선 순회를 켠다 */
  setAutoWander(on: boolean) {
    this.autoWander = on
  }

  private resize() {
    const w = this.host.clientWidth || 1
    const h = this.host.clientHeight || 1
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  dispose() {
    gsap.ticker.remove(this.tickerFn)
    this.resizeObserver.disconnect()
    window.removeEventListener('pointermove', this.onPointerMove)
    this.lineGeometry.dispose()
    this.lineMaterial.dispose()
    this.floaters.forEach((m) => {
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
    })
    this.renderer.dispose()
  }
}
