import * as THREE from 'three'
import gsap from 'gsap'
import { dotVertex, dotFragment } from './shaders'
import { palettes, type PaletteName } from './palettes'

const ROWS = 36
const MAX_DOTS = 6000

/**
 * 전역 아우라 배경 씬.
 * 커서·스크롤에 반응하는 dot 필드를 Three.js Points로 렌더링하고,
 * 팔레트/강도를 uniform으로 흘려보낸다. 격자는 뷰포트 비율이 바뀔 때마다
 * (리사이즈) 물리적으로 균일한 간격을 유지하도록 다시 생성된다.
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

  constructor(canvas: HTMLCanvasElement) {
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
        uBaseSize: { value: 3.2 },
        uColorA: { value: new THREE.Color(palettes.hero[0]) },
        uColorB: { value: new THREE.Color(palettes.hero[1]) },
        uColorC: { value: new THREE.Color(palettes.hero[2]) },
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
    this.resize()

    this.tickerFn = () => {
      const u = this.material.uniforms
      u.uTime.value = gsap.ticker.time
      ;(u.uMouse.value as THREE.Vector2).lerp(this.targetMouse, 0.08)
      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
  }

  /** 뷰포트 비율에 맞춰 물리적으로 정사각 간격인 dot 격자를 새로 만든다 */
  private buildGrid(ratio: number) {
    const cols = Math.max(8, Math.round(ROWS * ratio))
    const rows = ROWS
    const total = cols * rows
    const scale = total > MAX_DOTS ? Math.sqrt(MAX_DOTS / total) : 1
    const c = Math.max(4, Math.round(cols * scale))
    const r = Math.max(4, Math.round(rows * scale))

    const positions = new Float32Array(c * r * 3)
    const randoms = new Float32Array(c * r)
    let i = 0
    for (let y = 0; y < r; y++) {
      for (let x = 0; x < c; x++) {
        const u = (x / (c - 1)) * 2 - 1
        const v = (y / (r - 1)) * 2 - 1
        positions[i * 3] = u * ratio
        positions[i * 3 + 1] = v
        positions[i * 3 + 2] = 0
        randoms[i] = Math.random()
        i++
      }
    }

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
    this.buildGrid(w / h)
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
