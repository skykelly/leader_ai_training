import * as THREE from 'three'
import gsap from 'gsap'
import { coreVertex, coreFragment, glowVertex, glowFragment } from './coreShaders'
import { palettes, type PaletteName } from './palettes'

/**
 * 전역 synthetic core 씬.
 * 노이즈로 표면이 변위되는 발광 구체(core) + 뒷면만 그리는 더 큰 반투명
 * 구체(glow shell, additive)로 후처리 없이 bloom을 흉내낸다. 배경에는
 * 옅은 점 필드를 두어 깊이감을 더한다. 스크롤 섹션이 팔레트를, 마우스가
 * 미세한 기울임(패럴랙스)을 담당한다.
 */
export class CoreScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private group = new THREE.Group()
  private coreMaterial: THREE.ShaderMaterial
  private glowMaterial: THREE.ShaderMaterial
  private starField: THREE.Points

  private targetMouse = new THREE.Vector2(0, 0)
  private mouse = new THREE.Vector2(0, 0)
  private tickerFn: () => void
  private onResize: () => void
  private onPointerMove: (e: PointerEvent) => void
  private lastTime = 0
  private autoRotation = 0

  constructor(canvas: HTMLCanvasElement, initialPalette: PaletteName = 'hero') {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    this.camera.position.set(0, 0, 4.4)

    const initColors = palettes[initialPalette]

    const coreGeo = new THREE.IcosahedronGeometry(1, 24)
    this.coreMaterial = new THREE.ShaderMaterial({
      vertexShader: coreVertex,
      fragmentShader: coreFragment,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.09 },
        uFrequency: { value: 1.6 },
        uGlow: { value: 1 },
        uColorA: { value: new THREE.Color(initColors[0]) },
        uColorB: { value: new THREE.Color(initColors[1]) },
      },
    })
    const coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial)
    this.group.add(coreMesh)

    const glowGeo = new THREE.IcosahedronGeometry(1.35, 12)
    this.glowMaterial = new THREE.ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uGlow: { value: 1 },
        uColor: { value: new THREE.Color(initColors[0]) },
      },
    })
    const glowMesh = new THREE.Mesh(glowGeo, this.glowMaterial)
    this.group.add(glowMesh)

    this.scene.add(this.group)
    this.starField = this.buildStarField()
    this.scene.add(this.starField)

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

      this.coreMaterial.uniforms.uTime.value = now
      this.mouse.lerp(this.targetMouse, 0.06)

      this.autoRotation += dt * 0.09
      this.group.rotation.y = this.autoRotation + this.mouse.x * 0.35
      this.group.rotation.x = this.mouse.y * 0.22
      this.starField.rotation.y = this.autoRotation * 0.08

      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
  }

  private buildStarField(): THREE.Points {
    const count = 800
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 10
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return new THREE.Points(geo, mat)
  }

  /** 섹션 전환 — core/glow 색을 GSAP으로 lerp */
  setPalette(name: PaletteName, duration = 1.4) {
    const [a, b] = palettes[name]
    const targetA = new THREE.Color(a)
    const targetB = new THREE.Color(b)
    gsap.to(this.coreMaterial.uniforms.uColorA.value, { r: targetA.r, g: targetA.g, b: targetA.b, duration, ease: 'power2.inOut', overwrite: 'auto' })
    gsap.to(this.coreMaterial.uniforms.uColorB.value, { r: targetB.r, g: targetB.g, b: targetB.b, duration, ease: 'power2.inOut', overwrite: 'auto' })
    gsap.to(this.glowMaterial.uniforms.uColor.value, { r: targetA.r, g: targetA.g, b: targetA.b, duration, ease: 'power2.inOut', overwrite: 'auto' })
  }

  setAmplitude(value: number, duration = 0.8) {
    gsap.to(this.coreMaterial.uniforms.uAmplitude, { value, duration, ease: 'power2.out', overwrite: 'auto' })
  }

  setGlow(value: number, duration = 0.8) {
    gsap.to(this.coreMaterial.uniforms.uGlow, { value, duration, ease: 'power2.out', overwrite: 'auto' })
    gsap.to(this.glowMaterial.uniforms.uGlow, { value, duration, ease: 'power2.out', overwrite: 'auto' })
  }

  setScale(value: number, duration = 0.9) {
    gsap.to(this.group.scale, { x: value, y: value, z: value, duration, ease: 'power3.out', overwrite: 'auto' })
  }

  pulse() {
    const u = this.coreMaterial.uniforms.uAmplitude
    gsap
      .timeline()
      .to(u, { value: u.value + 0.08, duration: 0.2, ease: 'power2.out' })
      .to(u, { value: 0.09, duration: 0.7, ease: 'power2.inOut' })
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
    this.coreMaterial.dispose()
    this.glowMaterial.dispose()
    this.renderer.dispose()
  }
}
