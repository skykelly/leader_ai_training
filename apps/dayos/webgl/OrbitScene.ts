import * as THREE from 'three'
import gsap from 'gsap'
import { ringVertex, ringFragment, glowVertex, glowFragment, beamVertex, beamFragment } from './orbitShaders'

const CORE_COLOR = '#c8ff4d'
const RING_COUNTS = [8, 11, 14]
const RING_RADII = [1.35, 2.0, 2.7]
const RING_INCLINES = [0.18, -0.32, 0.5]
const RING_SPEEDS = [0.16, -0.11, 0.08]

/**
 * 전역 오빗 링 씬. Dayos의 핵심 메시지 — 흩어진 통합 툴들이 하나의 AI 코어를
 * 중심으로 정렬된다 — 를 서로 다른 반지름·기울기·속도로 도는 세 겹의 궤도로
 * 형상화한다. 스크롤이 진행될수록 안쪽 링부터 순서대로 나타나(정렬되어)고,
 * 카메라가 코어 쪽으로 서서히 다가간다.
 */
export class OrbitScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private group = new THREE.Group()
  private ringMaterial: THREE.ShaderMaterial
  private glowMaterial: THREE.ShaderMaterial
  private orbitLineMats: THREE.LineBasicMaterial[] = []
  private beams: { mat: THREE.ShaderMaterial; positions: Float32Array; attr: THREE.BufferAttribute; ring: number; phase: number }[] = []

  private targetMouse = new THREE.Vector2(0, 0)
  private autoWander = false
  private mouse = new THREE.Vector2(0, 0)
  private progress = 0
  private targetProgress = 0
  private autoRotation = 0

  private tickerFn: () => void
  private onResize: () => void
  private onPointerMove: (e: PointerEvent) => void
  private lastTime = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    this.camera.position.set(0, 0, 7)

    // AI 코어 — 작은 발광 구체 + 프레넬 글로우 셸
    const coreGeo = new THREE.IcosahedronGeometry(0.34, 3)
    const coreMat = new THREE.MeshBasicMaterial({ color: CORE_COLOR })
    this.group.add(new THREE.Mesh(coreGeo, coreMat))

    this.glowMaterial = new THREE.ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(CORE_COLOR) },
        uGlow: { value: 1 },
      },
    })
    const glowGeo = new THREE.IcosahedronGeometry(0.56, 3)
    this.group.add(new THREE.Mesh(glowGeo, this.glowMaterial))

    // 오빗 링 위의 통합 아이콘 노드들 — 하나의 Points로 통합
    const total = RING_COUNTS.reduce((a, b) => a + b, 0)
    const radii = new Float32Array(total)
    const inclines = new Float32Array(total)
    const phases = new Float32Array(total)
    const speeds = new Float32Array(total)
    const ringIdx = new Float32Array(total)
    const randoms = new Float32Array(total)
    const positions = new Float32Array(total * 3)

    let p = 0
    RING_COUNTS.forEach((count, ring) => {
      for (let i = 0; i < count; i++) {
        radii[p] = RING_RADII[ring]
        inclines[p] = RING_INCLINES[ring]
        phases[p] = (i / count) * Math.PI * 2 + Math.random() * 0.15
        speeds[p] = RING_SPEEDS[ring]
        ringIdx[p] = ring
        randoms[p] = Math.random()
        p++
      }
    })

    const ringGeo = new THREE.BufferGeometry()
    ringGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    ringGeo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1))
    ringGeo.setAttribute('aIncline', new THREE.BufferAttribute(inclines, 1))
    ringGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    ringGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    ringGeo.setAttribute('aRing', new THREE.BufferAttribute(ringIdx, 1))
    ringGeo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

    this.ringMaterial = new THREE.ShaderMaterial({
      vertexShader: ringVertex,
      fragmentShader: ringFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color(CORE_COLOR) },
        uOpacity0: { value: 0 },
        uOpacity1: { value: 0 },
        uOpacity2: { value: 0 },
      },
    })
    this.group.add(new THREE.Points(ringGeo, this.ringMaterial))

    // 타원 궤도선 — ringVertex 셰이더와 정확히 같은 수식으로 점열을 만들어야
    // 노드가 선 위에 올라탄다 (수식이 어긋나면 검증 스크린샷에서 즉시 드러남)
    const BEAM_SEGMENTS = 24
    RING_RADII.forEach((r, ring) => {
      const incline = RING_INCLINES[ring]
      const pts: THREE.Vector3[] = []
      for (let s = 0; s < 128; s++) {
        const a = (s / 128) * Math.PI * 2
        pts.push(new THREE.Vector3(r * Math.cos(a), -r * Math.sin(a) * Math.sin(incline), r * Math.sin(a) * Math.cos(incline)))
      }
      const lineMat = new THREE.LineBasicMaterial({ color: CORE_COLOR, transparent: true, opacity: 0 })
      this.orbitLineMats.push(lineMat)
      this.group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat))

      // 링당 대표 노드 1개에서 코어로 향하는 연결 빔 — 파동이 코어 쪽으로 흐른다
      const beamPositions = new Float32Array((BEAM_SEGMENTS + 1) * 3)
      const ts = new Float32Array(BEAM_SEGMENTS + 1)
      for (let s = 0; s <= BEAM_SEGMENTS; s++) ts[s] = s / BEAM_SEGMENTS
      const beamGeo = new THREE.BufferGeometry()
      const posAttr = new THREE.BufferAttribute(beamPositions, 3)
      beamGeo.setAttribute('position', posAttr)
      beamGeo.setAttribute('aT', new THREE.BufferAttribute(ts, 1))
      const beamMat = new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(CORE_COLOR) },
          uOpacity: { value: 0 },
        },
      })
      this.group.add(new THREE.Line(beamGeo, beamMat))
      // 대표 노드 = 이 링의 첫 번째 노드와 같은 위상(phases 배열의 링 시작 인덱스)
      const startIdx = RING_COUNTS.slice(0, ring).reduce((a, b) => a + b, 0)
      this.beams.push({ mat: beamMat, positions: beamPositions, attr: posAttr, ring, phase: phases[startIdx] })
    })

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

      this.ringMaterial.uniforms.uTime.value = now
      // 터치 기기에는 커서가 없으므로 느린 리사주 궤적이 시선 이동을 대신한다
      if (this.autoWander) this.targetMouse.set(Math.sin(now * 0.3) * 0.4, Math.cos(now * 0.23) * 0.25)
      this.mouse.lerp(this.targetMouse, 0.06)
      this.progress += (this.targetProgress - this.progress) * Math.min(1, dt * 2.4)

      // 안쪽 링부터 순서대로 정렬되듯 나타난다
      const u = this.ringMaterial.uniforms
      u.uOpacity0.value = THREE.MathUtils.smoothstep(this.progress, 0.0, 0.3)
      u.uOpacity1.value = THREE.MathUtils.smoothstep(this.progress, 0.25, 0.6)
      u.uOpacity2.value = THREE.MathUtils.smoothstep(this.progress, 0.5, 0.95)

      // 궤도선·빔은 소속 링의 리빌 진행도와 동기화
      const ringOps = [u.uOpacity0.value, u.uOpacity1.value, u.uOpacity2.value]
      this.orbitLineMats.forEach((mat, i) => (mat.opacity = ringOps[i] * 0.25))
      for (const beam of this.beams) {
        beam.mat.uniforms.uTime.value = now
        beam.mat.uniforms.uOpacity.value = ringOps[beam.ring]
        // 대표 노드의 현재 위치를 셰이더와 같은 수식으로 재계산해 빔 끝점을 따라붙인다
        const r = RING_RADII[beam.ring]
        const incline = RING_INCLINES[beam.ring]
        const angle = beam.phase + now * RING_SPEEDS[beam.ring]
        const nx = r * Math.cos(angle)
        const ny = -r * Math.sin(angle) * Math.sin(incline)
        const nz = r * Math.sin(angle) * Math.cos(incline)
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
        const seg = beam.positions.length / 3 - 1
        for (let s = 0; s <= seg; s++) {
          const t = s / seg
          // t=0은 코어 표면(반지름 0.36)에서 시작
          const k = 0.36 / len + (1 - 0.36 / len) * t
          beam.positions[s * 3] = nx * k
          beam.positions[s * 3 + 1] = ny * k
          beam.positions[s * 3 + 2] = nz * k
        }
        beam.attr.needsUpdate = true
      }

      this.camera.position.z = THREE.MathUtils.lerp(7, 4.6, THREE.MathUtils.clamp(this.progress, 0, 1))

      this.autoRotation += dt * 0.05
      this.group.rotation.y = this.autoRotation + this.mouse.x * 0.25
      this.group.rotation.x = this.mouse.y * 0.15

      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
  }

  /** 마스터 ScrollTrigger가 0..1 범위의 진행도를 흘려보낸다 */
  /** 터치 기기용: 커서 대신 자동 시선 순회를 켠다 */
  setAutoWander(on: boolean) {
    this.autoWander = on
  }

  setProgress(value: number) {
    this.targetProgress = THREE.MathUtils.clamp(value, 0, 1)
  }

  /** 기능 섹션 진입 시 코어 글로우를 짧게 강조 */
  pulse() {
    const u = this.glowMaterial.uniforms.uGlow
    gsap.killTweensOf(u)
    gsap.timeline().to(u, { value: 1.8, duration: 0.25, ease: 'power2.out' }).to(u, { value: 1, duration: 0.9, ease: 'power2.inOut' })
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
    this.ringMaterial.dispose()
    this.glowMaterial.dispose()
    this.orbitLineMats.forEach((m) => m.dispose())
    this.beams.forEach((b) => b.mat.dispose())
    this.renderer.dispose()
  }
}
