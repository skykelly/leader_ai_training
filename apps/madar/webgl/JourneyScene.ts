import * as THREE from 'three'
import gsap from 'gsap'
import { tubeVertex, tubeFragment, nodeGlowVertex, nodeGlowFragment } from './journeyShaders'

const NAVY = '#172e64'
const CORAL = '#ff6340'

// 카메라 궤도를 경로 위쪽·뒤쪽으로 띄우는 고정 오프셋
const CAMERA_OFFSET = new THREE.Vector3(0, 0.55, 0.9)

// 경로가 지나가는 웨이포인트 — hero, 기능 3개, 통계, CTA 순서로 총 6개.
// 완전한 직선이 아니라 좌우·상하로 살짝 굽이치게 해 "경로"라는 느낌을 살린다.
const WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0.55, 0),
  new THREE.Vector3(1.3, 0.12, -2.6),
  new THREE.Vector3(-1.15, -0.35, -5.4),
  new THREE.Vector3(1.5, 0.4, -8.2),
  new THREE.Vector3(-0.75, -0.2, -11.0),
  new THREE.Vector3(0.55, 0.35, -13.6),
]

/**
 * 전역 "경로(journey)" 씬.
 * 네이비→코럴 그라디언트 튜브가 하나의 경로를 그리고, 스크롤 진행도에 따라
 * 카메라가 그 경로 위를 실제로 이동한다(돌리 트랙). 각 웨이포인트에는 발광
 * 노드를 두어 섹션이 화면에 들어올 때 해당 노드가 밝아지며 "정류장에
 * 도착했다"는 느낌을 준다. 원본(Madar)의 핵심 3D 모티프 — 반복되는 경로
 * 그래픽이자 물류(운송·경로)의 은유이자 스크롤 내비게이션 그 자체 — 를
 * 재현한 것이다.
 */
export class JourneyScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private curve: THREE.CatmullRomCurve3
  private cameraCurve: THREE.CatmullRomCurve3
  private tubeMaterial: THREE.ShaderMaterial
  private nodeCores: THREE.Mesh[] = []
  private nodeGlowMaterials: THREE.ShaderMaterial[] = []
  private starField: THREE.Points

  private targetMouse = new THREE.Vector2(0, 0)
  private mouse = new THREE.Vector2(0, 0)
  private progress = 0
  private targetProgress = 0
  private activeNode = -1

  private tickerFn: () => void
  private onResize: () => void
  private onPointerMove: (e: PointerEvent) => void
  private lastTime = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.05, 60)

    this.curve = new THREE.CatmullRomCurve3(WAYPOINTS, false, 'catmullrom', 0.45)
    // 카메라는 경로 중심선이 아니라 살짝 띄운 별도의 궤도를 따라 이동한다 —
    // 그래야 드론이 도로를 내려다보며 따라가듯 튜브·노드를 "바깥에서" 볼 수 있다.
    // (중심선 그대로 쓰면 카메라가 튜브·노드 글로우 구체 내부를 관통해 화면이
    // 단색으로 뒤덮이는 문제가 있었다)
    const cameraWaypoints = WAYPOINTS.map((p) => p.clone().add(CAMERA_OFFSET))
    this.cameraCurve = new THREE.CatmullRomCurve3(cameraWaypoints, false, 'catmullrom', 0.45)
    const tubeGeo = new THREE.TubeGeometry(this.curve, 320, 0.05, 12, false)
    this.tubeMaterial = new THREE.ShaderMaterial({
      vertexShader: tubeVertex,
      fragmentShader: tubeFragment,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColorA: { value: new THREE.Color(NAVY) },
        uColorB: { value: new THREE.Color(CORAL) },
      },
    })
    this.scene.add(new THREE.Mesh(tubeGeo, this.tubeMaterial))

    WAYPOINTS.forEach((p, i) => {
      const t = i / (WAYPOINTS.length - 1)
      const color = new THREE.Color(NAVY).lerp(new THREE.Color(CORAL), t)

      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 2), new THREE.MeshBasicMaterial({ color }))
      core.position.copy(p)
      this.scene.add(core)
      this.nodeCores.push(core)

      const glowMat = new THREE.ShaderMaterial({
        vertexShader: nodeGlowVertex,
        fragmentShader: nodeGlowFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: color.clone() },
          uGlow: { value: 0.5 },
        },
      })
      const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 3), glowMat)
      glow.position.copy(p)
      this.scene.add(glow)
      this.nodeGlowMaterials.push(glowMat)
    })

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

      this.tubeMaterial.uniforms.uTime.value = now
      this.mouse.lerp(this.targetMouse, 0.06)
      this.progress += (this.targetProgress - this.progress) * Math.min(1, dt * 4)
      this.tubeMaterial.uniforms.uProgress.value = this.progress

      const t = THREE.MathUtils.clamp(this.progress, 0, 1)
      const lookT = THREE.MathUtils.clamp(t + 0.05, 0, 1)
      // 카메라 위치는 띄운 궤도에서, 시선은 실제 경로 튜브 위 살짝 앞쪽 지점을 향한다
      this.camera.position.copy(this.cameraCurve.getPointAt(t))
      this.camera.lookAt(this.curve.getPointAt(lookT))
      this.camera.rotateY(this.mouse.x * 0.09)
      this.camera.rotateX(this.mouse.y * 0.05)

      this.starField.rotation.y = now * 0.01

      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
  }

  private buildStarField(): THREE.Points {
    const count = 700
    const positions = new Float32Array(count * 3)
    const mid = new THREE.Vector3(0, 0, -6.5)
    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 14
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      positions[i * 3] = mid.x + r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = mid.y + r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = mid.z + r * Math.cos(phi)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return new THREE.Points(geo, mat)
  }

  /** 마스터 ScrollTrigger가 문서 전체 진행도(0..1)를 매 프레임 흘려보낸다 */
  setProgress(t: number) {
    this.targetProgress = THREE.MathUtils.clamp(t, 0, 1)
  }

  /** 섹션이 화면에 들어오면 해당 웨이포인트 노드를 펄스+밝기로 강조한다 */
  setActiveNode(index: number) {
    if (index === this.activeNode) return
    this.activeNode = index
    this.nodeGlowMaterials.forEach((mat, i) => {
      gsap.to(mat.uniforms.uGlow, {
        value: i === index ? 1.7 : 0.5,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    })
    const core = this.nodeCores[index]
    if (!core) return
    gsap.killTweensOf(core.scale)
    gsap
      .timeline()
      .to(core.scale, { x: 1.7, y: 1.7, z: 1.7, duration: 0.4, ease: 'back.out(2.4)' })
      .to(core.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'power2.out' })
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
    this.tubeMaterial.dispose()
    this.nodeGlowMaterials.forEach((m) => m.dispose())
    this.renderer.dispose()
  }
}
