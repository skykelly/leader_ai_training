import * as THREE from 'three'
import gsap from 'gsap'
import { dotVertex, dotFragment } from './shaders'
import { palettes, type PaletteName } from './palettes'
import { FlowField } from './FlowField'
import { FaceCloud } from './FaceCloud'

const ROWS = 36
const MAX_DOTS = 6000

export type AuraMode = 'flow' | 'face'

/**
 * 전역 아우라 배경 씬.
 * 하나의 Points/geometry를 두 "드라이버" 중 하나가 매 프레임 채운다:
 * - flow: 점들이 노이즈 흐름장을 따라 실제로 이동하는 배경(홈)
 * - face: 정면 얼굴 point cloud, 커서 방향으로 yaw/pitch 회전(진단 페이지)
 * 페이지 전환은 항상 풀스크린 웨이브 오버레이로 가려지므로 모드 전환에
 * 별도 크로스페이드가 필요 없다 — setMode는 즉시 드라이버를 교체한다.
 */
export class AuraScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private material: THREE.ShaderMaterial
  private points: THREE.Points
  private geometry: THREE.BufferGeometry
  private targetMouse = new THREE.Vector2(0, 0)
  private tickerFn: () => void
  private onResize: () => void
  private onPointerMove: (e: PointerEvent) => void
  private resizeTimer: ReturnType<typeof setTimeout> | undefined
  private lastTime = 0

  private mode: AuraMode = 'flow'
  private flow: FlowField | null = null
  private face: FaceCloud | null = null

  constructor(canvas: HTMLCanvasElement, initialMode: AuraMode = 'flow', initialPalette: PaletteName = 'hero') {
    this.mode = initialMode
    const initColors = palettes[initialPalette]
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.geometry = new THREE.BufferGeometry()
    this.material = new THREE.ShaderMaterial({
      vertexShader: dotVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uIntensity: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uBaseSize: { value: initialMode === 'flow' ? 3.2 : 2.5 },
        uDepthBoost: { value: initialMode === 'flow' ? 2.2 : 4.5 },
        uMouseFx: { value: initialMode === 'flow' ? 1 : 0 },
        uBreathAmount: { value: initialMode === 'flow' ? 1 : 0.4 },
        uColorA: { value: new THREE.Color(initColors[0]) },
        uColorB: { value: new THREE.Color(initColors[1]) },
        uColorC: { value: new THREE.Color(initColors[2]) },
      },
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)

    this.onResize = () => {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => this.resize(), 120)
    }
    this.onPointerMove = (e) => {
      this.targetMouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      )
    }
    window.addEventListener('resize', this.onResize)
    window.addEventListener('pointermove', this.onPointerMove)
    this.resize() // 초기 드라이버(flow 또는 face)를 여기서 생성

    this.tickerFn = () => {
      const now = gsap.ticker.time
      const dt = Math.min(now - this.lastTime, 0.05)
      this.lastTime = now

      const u = this.material.uniforms
      u.uTime.value = now
      const mouse = u.uMouse.value as THREE.Vector2
      mouse.lerp(this.targetMouse, 0.08)

      const ratio = u.uResolution.value.x / u.uResolution.value.y
      const posAttr = this.geometry.attributes.position as THREE.BufferAttribute | undefined
      if (this.mode === 'flow' && this.flow) {
        this.flow.step(dt, now, ratio)
        if (posAttr) posAttr.needsUpdate = true
      } else if (this.mode === 'face' && this.face) {
        this.face.setTarget(mouse.x, mouse.y)
        this.face.step(dt, now, ratio)
        if (posAttr) posAttr.needsUpdate = true
      }

      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
  }

  /** flow ↔ face 드라이버 전환. 페이지 전환 와이프가 화면을 덮는 동안 즉시 교체된다 */
  setMode(mode: AuraMode) {
    if (this.mode === mode) return
    this.mode = mode
    this.rebuildActive()
    // face 모드에서는 로컬 커서 글로우/밀어내기를 끈다 — 얼굴 크기가 그 반경과
    // 비슷해 전체가 뭉개지며, head-tracking 회전이 이미 마우스 반응 역할을 한다
    gsap.to(this.material.uniforms.uMouseFx, {
      value: mode === 'flow' ? 1 : 0,
      duration: 0.4,
      overwrite: 'auto',
    })
    gsap.to(this.material.uniforms.uBaseSize, {
      value: mode === 'flow' ? 3.2 : 2.5,
      duration: 0.4,
      overwrite: 'auto',
    })
    gsap.to(this.material.uniforms.uDepthBoost, {
      value: mode === 'flow' ? 2.2 : 4.5,
      duration: 0.4,
      overwrite: 'auto',
    })
    gsap.to(this.material.uniforms.uBreathAmount, {
      value: mode === 'flow' ? 1 : 0.4,
      duration: 0.4,
      overwrite: 'auto',
    })
  }

  private rebuildActive() {
    const ratio = window.innerWidth / window.innerHeight
    if (this.mode === 'flow') {
      const count = this.flowCountFor(ratio)
      this.flow = new FlowField(count, ratio)
      this.allocateGeometry(this.flow.positions, this.flow.randoms)
    } else {
      this.face = new FaceCloud()
      this.allocateGeometry(this.face.positions, this.face.randoms)
    }
  }

  private flowCountFor(ratio: number) {
    const cols = Math.max(8, Math.round(ROWS * ratio))
    const total = cols * ROWS
    return Math.min(total, MAX_DOTS)
  }

  private allocateGeometry(positions: Float32Array, randoms: Float32Array) {
    this.geometry.dispose()
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))
    this.points.geometry = this.geometry
  }

  /** 팔레트 전환 — GSAP으로 각 색상 채널을 lerp */
  setPalette(name: PaletteName, duration = 1.4) {
    const [a, b, c] = palettes[name]
    const u = this.material.uniforms
    for (const [uniform, hex] of [
      [u.uColorA, a],
      [u.uColorB, b],
      [u.uColorC, c],
    ] as const) {
      const target = new THREE.Color(hex)
      gsap.to(uniform.value as THREE.Color, {
        r: target.r,
        g: target.g,
        b: target.b,
        duration,
        ease: 'power2.inOut',
        overwrite: 'auto',
      })
    }
  }

  setIntensity(value: number, duration = 1.2) {
    gsap.to(this.material.uniforms.uIntensity, {
      value,
      duration,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  /** 선택/전환 순간의 펄스 연출 */
  pulse() {
    const u = this.material.uniforms.uIntensity
    gsap
      .timeline()
      .to(u, { value: u.value + 0.5, duration: 0.25, ease: 'power2.out' })
      .to(u, { value: 1, duration: 0.9, ease: 'power2.inOut' })
  }

  setScroll(progress: number) {
    this.material.uniforms.uScroll.value = progress
  }

  private resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    ;(this.material.uniforms.uResolution.value as THREE.Vector2).set(w, h)
    this.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
    // face는 매 프레임 ratio를 반영해 재투영하므로 리사이즈로 재생성할 필요가 없다.
    // flow는 화면을 채우는 점 개수·랩어라운드 경계가 비율에 의존하므로 다시 만든다.
    const noDriverYet = !this.flow && !this.face
    if (this.mode === 'flow' || noDriverYet) {
      this.rebuildActive()
    }
  }

  dispose() {
    clearTimeout(this.resizeTimer)
    gsap.ticker.remove(this.tickerFn)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.geometry.dispose()
    this.renderer.dispose()
    this.material.dispose()
  }
}
