import * as THREE from 'three'
import gsap from 'gsap'
import { particleVertex, particleFragment } from './particleShaders'
import { generateShapes } from './shapes'

const COUNT = 6000

const COLOR_CHAOS = '#6b7280'
const COLOR_BULB = '#f5b942'
const COLOR_GLOBE = '#8ecbff'

/**
 * 전역 파티클 셰이프 모프 씬.
 * chaos(흩어진 지식) → bulb(통찰) → globe(공유된 전역 지식) 세 형태의 정점을
 * 하나의 지오메트리에 attribute로 실어두고, uMorph 유니폼 하나로 GPU에서
 * 보간한다. 스크롤 진행도가 목표 morph 값이 되고, 매 프레임 부드럽게
 * 그 값을 향해 lerp된다(급격한 점프 없이 자연스러운 형태 전환).
 */
export class ParticleScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private group = new THREE.Group()
  private material: THREE.ShaderMaterial

  private targetMouse = new THREE.Vector2(0, 0)
  private mouse = new THREE.Vector2(0, 0)
  private morph = 0
  private targetMorph = 0
  private autoRotation = 0

  private tickerFn: () => void
  private onResize: () => void
  private onPointerMove: (e: PointerEvent) => void
  private lastTime = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    this.camera.position.set(0, 0, 4.4)

    const { chaos, bulb, globe } = generateShapes(COUNT)
    const randoms = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) randoms[i] = Math.random()

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(chaos, 3))
    geometry.setAttribute('aPosB', new THREE.BufferAttribute(bulb, 3))
    geometry.setAttribute('aPosC', new THREE.BufferAttribute(globe, 3))
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMorph: { value: 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 5.5 },
        uColorChaos: { value: new THREE.Color(COLOR_CHAOS) },
        uColorBulb: { value: new THREE.Color(COLOR_BULB) },
        uColorGlobe: { value: new THREE.Color(COLOR_GLOBE) },
        uFlash: { value: 0 },
      },
    })

    const points = new THREE.Points(geometry, this.material)
    this.group.add(points)
    this.scene.add(this.group)

    this.onResize = () => this.resize()
    this.onPointerMove = (e) => {
      this.targetMouse.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
    }
    window.addEventListener('resize', this.onResize)
    window.addEventListener('pointermove', this.onPointerMove)
    this.resize()

    this.tickerFn = () => {
      const now = gsap.ticker.time
      const dt = Math.min(now - this.lastTime, 0.05)
      this.lastTime = now

      this.material.uniforms.uTime.value = now
      this.mouse.lerp(this.targetMouse, 0.06)
      const prevMorph = this.morph
      this.morph += (this.targetMorph - this.morph) * Math.min(1, dt * 3.2)
      this.material.uniforms.uMorph.value = this.morph

      // 전구가 완성되는 순간(morph=1 상향 통과)의 점화 플래시
      if (prevMorph < 1 && this.morph >= 1) {
        const u = this.material.uniforms.uFlash
        gsap.killTweensOf(u)
        gsap
          .timeline()
          .to(u, { value: 1, duration: 0.15, ease: 'power2.out' })
          .to(u, { value: 0, duration: 0.6, ease: 'power2.inOut' })
      }

      this.autoRotation += dt * 0.06
      this.group.rotation.y = this.autoRotation + this.mouse.x * 0.3
      this.group.rotation.x = this.mouse.y * 0.18

      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
  }

  /** 마스터 ScrollTrigger가 0..2 범위의 목표 morph 값을 흘려보낸다 */
  setMorph(value: number) {
    this.targetMorph = THREE.MathUtils.clamp(value, 0, 2)
  }

  /** 기능 섹션 진입 시의 짧은 강조 펄스 */
  pulse() {
    const u = this.material.uniforms.uSize
    gsap
      .timeline()
      .to(u, { value: u.value + 2.2, duration: 0.22, ease: 'power2.out' })
      .to(u, { value: 5.5, duration: 0.8, ease: 'power2.inOut' })
  }

  private resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  dispose() {
    gsap.ticker.remove(this.tickerFn)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.material.dispose()
    this.renderer.dispose()
  }
}
