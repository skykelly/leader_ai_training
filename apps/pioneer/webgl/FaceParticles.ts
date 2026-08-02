import * as THREE from 'three'
import gsap from 'gsap'
import { faceParticleVertex, faceParticleFragment, FACE_RINGS } from './faceParticleShaders'

/**
 * 텍스처 기반 얼굴 파티클 — preparetopioneer.com/experience의 구조를 재현한다.
 *
 * 원본은 albedo/depth 텍스처 한 쌍(실사 인물)을 쓰지만, 여기서는 직접 제작한
 * 헤드 스컬프트에서 뽑은 텍스처를 쓴다. 기법(격자 파티클 → UV 샘플링 →
 * depth 변위 → 밝기=알파 → 수명 순환 → 바람장 흐름)은 원본과 동일하다.
 *
 * 파라미터 기본값은 원본 번들에서 확인한 값을 따랐다:
 *   파티클 수 52,000 / lifeSpan 2~4s(variation 0.5)
 *   noiseFrequency 0.4 / noiseIntensity 0.015 / opacity 0.75
 *
 * 다만 scale은 번들 값(18~19)이 아니라 13이다. 번들 값은 원본의 카메라 거리·
 * 뷰포트 기준이라 이 씬에 그대로 넣으면 점이 서로 겹쳐 얼룩진 덩어리가 된다.
 * 원본 영상은 점이 낱알로 분리되어 보이므로, 영상과 대조해 크기를 줄이고
 * 그만큼 점당 밝기를 올렸다(겹침이 줄면 additive 누적도 함께 줄기 때문).
 */

// 원본 particleCount 기본 범위(52,000~52,500)에 맞춘 격자 — 228² = 51,984
const GRID = 228
const DEFAULT_COUNT = GRID * GRID

export interface FaceParticlesOptions {
  albedoUrl: string
  depthUrl: string
  /** 저사양/모바일에서 줄이기 위한 격자 한 변 (기본 228) */
  grid?: number
}

export class FaceParticles {
  readonly points: THREE.Points
  private geometry: THREE.BufferGeometry
  private material: THREE.ShaderMaterial
  private albedo: THREE.Texture | null = null
  private depth: THREE.Texture | null = null
  private lastTime = 0
  private ringSlot = 0

  constructor(opts: FaceParticlesOptions) {
    const grid = opts.grid ?? GRID
    const count = grid * grid

    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 4)
    let p = 0
    for (let j = 0; j < grid; j++) {
      for (let i = 0; i < grid; i++) {
        // 격자를 -1..1에 균일 배치하고 셀 안에서 살짝 흔들어 모아레를 없앤다
        const jitterX = (Math.random() - 0.5) / grid
        const jitterY = (Math.random() - 0.5) / grid
        positions[p * 3] = (i / (grid - 1)) * 2 - 1 + jitterX * 2
        positions[p * 3 + 1] = -((j / (grid - 1)) * 2 - 1) + jitterY * 2
        positions[p * 3 + 2] = 0
        seeds[p * 4] = Math.random()
        seeds[p * 4 + 1] = Math.random()
        seeds[p * 4 + 2] = Math.random()
        seeds[p * 4 + 3] = Math.random()
        p++
      }
    }

    this.geometry = new THREE.BufferGeometry()
    // position은 three가 프러스텀 컬링에 쓰므로 초기 격자를 그대로 넣어둔다
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aInitialPos', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
    // 파티클이 바람장으로 격자 밖까지 흐르므로 컬링 구를 넉넉히 잡는다
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 3)

    this.material = new THREE.ShaderMaterial({
      vertexShader: faceParticleVertex,
      fragmentShader: faceParticleFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uLifeSpan: { value: 3 },
        uLifeSpanVariation: { value: 0.5 },
        uParticleScale: { value: 13 },
        uScaleVariation: { value: 1.5 },
        uNoiseFrequency: { value: 0.4 },
        uNoiseIntensity: { value: 0.015 },
        uDepthScale: { value: 0.55 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uYaw: { value: 0 },
        uPitch: { value: 0 },
        uExplosion: { value: 0 },
        uOpacity: { value: 0 }, // 페이드인으로 올린다
        uTypeFactor: { value: 0 },
        uTypePulse: { value: 0 },
        // 비활성 링은 큰 음수 — 나이가 수명을 넘어 셰이더에서 걸러진다
        uRingT: { value: new Array(FACE_RINGS).fill(-999) },
        // 링은 약 0.7초면 얼굴 밖으로 빠져나간다. 수명을 그보다 길게 잡으면
        // 단어 간격(0.4~0.6초)당 링이 서너 겹씩 쌓여 다시 출렁임으로 뭉개진다
        uRingLife: { value: 1.15 },
        uRingSpeed: { value: 0.5 },
        uRingWidth: { value: 0.085 },
        uMonoColor: { value: new THREE.Color('#8302af') },
        uFaceAlbedo: { value: null },
        uFaceDepth: { value: null },
      },
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false

    const loader = new THREE.TextureLoader()
    loader.load(opts.albedoUrl, (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.minFilter = THREE.LinearFilter
      t.generateMipmaps = false
      this.albedo = t
      this.material.uniforms.uFaceAlbedo.value = t
      this.maybeReveal()
    })
    loader.load(opts.depthUrl, (t) => {
      t.minFilter = THREE.LinearFilter
      t.generateMipmaps = false
      this.depth = t
      this.material.uniforms.uFaceDepth.value = t
      this.maybeReveal()
    })
  }

  /** 텍스처가 둘 다 준비되면 부드럽게 나타난다 */
  private maybeReveal() {
    if (!this.albedo || !this.depth) return
    gsap.to(this.material.uniforms.uOpacity, { value: 0.75, duration: 1.6, ease: 'power2.out' })
  }

  get ready() {
    return !!(this.albedo && this.depth)
  }

  update(time: number, mouseX: number, mouseY: number) {
    const u = this.material.uniforms
    u.uTime.value = time
    // 링 발사는 렌더 루프 밖(타이핑 콜백)에서 오므로 마지막 시각을 기억해 둔다
    this.lastTime = time
    // 커서 방향으로 고개를 돌린다 — 원본과 같은 범위(약 ±30°)
    u.uYaw.value += (mouseX * 0.52 - u.uYaw.value) * 0.06
    u.uPitch.value += (-mouseY * 0.28 - u.uPitch.value) * 0.06
  }

  /** 팔레트 색으로 얼굴을 물들인다 */
  setColor(hex: string, duration = 1.2) {
    const target = new THREE.Color(hex)
    gsap.to(this.material.uniforms.uMonoColor.value as THREE.Color, {
      r: target.r, g: target.g, b: target.b, duration, overwrite: 'auto',
    })
  }

  /**
   * 진단 답변이 파티클의 생김새를 바꾼다 — 원본도 같은 방식으로 개인화한다
   * (원본: cloudOrDetails→개수, fameOrFortune→크기, mathematicianOrArtist→노이즈)
   */
  setPersona({ scale, noiseScale, speed }: { scale?: number; noiseScale?: number; speed?: number }) {
    const u = this.material.uniforms
    if (scale !== undefined) gsap.to(u.uParticleScale, { value: scale, duration: 1.2, overwrite: 'auto' })
    if (noiseScale !== undefined) gsap.to(u.uNoiseFrequency, { value: noiseScale, duration: 1.2, overwrite: 'auto' })
    if (speed !== undefined) gsap.to(u.uLifeSpan, { value: speed, duration: 1.2, overwrite: 'auto' })
  }

  /** 선택 순간의 펄스 — 파티클이 잠깐 크게 부풀었다 돌아온다 */
  pulse() {
    const u = this.material.uniforms.uParticleScale
    const base = u.value as number
    gsap.killTweensOf(u)
    gsap.timeline()
      .to(u, { value: base * 1.5, duration: 0.22, ease: 'power2.out' })
      .to(u, { value: base, duration: 0.9, ease: 'power2.inOut' })
  }

  /** 문장 출력 시작/끝 — 얼굴 전체가 동심원 파동으로 진동한다 */
  setTyping(on: boolean) {
    const u = this.material.uniforms.uTypeFactor
    gsap.killTweensOf(u)
    gsap.to(u, {
      value: on ? 1 : 0,
      duration: on ? 0.45 : 0.9,
      ease: on ? 'power2.out' : 'power2.inOut',
    })
  }

  /**
   * 단어마다 확산 링 하나를 쏜다 — 중심에서 태어나 바깥으로 퍼지며 사라진다.
   * 슬롯을 돌려 쓰므로 FACE_RINGS개까지 겹쳐 살아 있을 수 있고, 그보다 빨리
   * 쏘면 가장 오래된 링이 밀려난다.
   */
  ring() {
    const slots = this.material.uniforms.uRingT.value as number[]
    slots[this.ringSlot] = this.lastTime
    this.ringSlot = (this.ringSlot + 1) % slots.length
  }

  /**
   * 글자가 찍힐 때마다 진폭이 튄다 — 타이핑 리듬이 그대로 파티클에 실린다.
   * 감쇠가 글자 간격(약 82ms)보다 길면 값이 최대치에 눌러앉아 리듬이 사라지므로
   * 짧게 올렸다 떨어뜨린다.
   */
  typePulse() {
    const u = this.material.uniforms.uTypePulse
    gsap.killTweensOf(u)
    gsap.timeline()
      .to(u, { value: 1, duration: 0.05, ease: 'power2.out' })
      .to(u, { value: 0.12, duration: 0.18, ease: 'power2.in' })
  }

  /** 결과 전환 시 흩어졌다 다시 모인다 */
  explode() {
    const u = this.material.uniforms.uExplosion
    gsap.killTweensOf(u)
    gsap.timeline()
      .to(u, { value: 0.7, duration: 0.5, ease: 'power2.out' })
      .to(u, { value: 0, duration: 1.4, ease: 'power2.inOut' })
  }

  setPixelRatio(ratio: number) {
    this.material.uniforms.uPixelRatio.value = ratio
  }

  dispose() {
    gsap.killTweensOf(this.material.uniforms.uOpacity)
    this.geometry.dispose()
    this.material.dispose()
    this.albedo?.dispose()
    this.depth?.dispose()
  }
}

export { DEFAULT_COUNT }
