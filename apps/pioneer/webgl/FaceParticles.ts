import * as THREE from 'three'
import gsap from 'gsap'
import { faceParticleVertex, faceParticleFragment, FACE_RINGS } from './faceParticleShaders'

/**
 * 텍스처 기반 얼굴 파티클 — preparetopioneer.com/experience의 구조를 재현한다.
 *
 * 텍스처는 3D 헤드 모델에서 구웠다(`scripts/bake-face-textures.mjs`):
 *   face-depth.png   R=깊이(1=코), G=커버리지
 *   face-normal.png  뷰 공간 법선
 * 모델을 런타임에 싣지는 않는다 — GLB는 24MB지만 구운 텍스처는 수백 KB고,
 * 런타임 구조(위치 → UV 샘플링 → depth 변위)는 그대로 쓸 수 있다.
 *
 * 파티클 배치는 균등 격자가 아니라 **커버리지·단축(foreshortening) 가중
 * 샘플링**이다. 격자는 얼굴 밖에 절반 가까이를 버리고, 남은 것도 화면 면적
 * 기준이라 옆으로 누운 표면(실루엣·콧방울)이 성기게 깔린다. 두 맵을 읽어
 * 표면적 기준으로 뿌리면 같은 개수로 형태가 훨씬 또렷해진다.
 *
 * 파라미터 기본값은 원본 번들에서 확인한 값을 따랐다(파티클 수는 밀도를
 * 낮춰 달라는 요청에 따라 52,000 → 34,000):
 *   lifeSpan 2~4s(variation 0.5)
 *   noiseFrequency 0.4 / noiseIntensity 0.015 / opacity 0.75
 * 다만 scale은 번들 값(18~19)이 아니라 13이다. 번들 값은 원본의 카메라 거리·
 * 뷰포트 기준이라 그대로 넣으면 점이 겹쳐 얼룩진 덩어리가 된다.
 */

const DEFAULT_COUNT = 34000

export interface FaceParticlesOptions {
  depthUrl: string
  normalUrl: string
  /** 저사양/모바일에서 줄이기 위한 파티클 수 */
  count?: number
}

/** 이미지를 픽셀 배열로 — 가중 샘플링은 CPU에서 해야 하므로 캔버스로 읽어낸다 */
function readPixels(img: HTMLImageElement) {
  const cv = document.createElement('canvas')
  cv.width = img.naturalWidth
  cv.height = img.naturalHeight
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, cv.width, cv.height)
}

export class FaceParticles {
  readonly points: THREE.Points
  private geometry: THREE.BufferGeometry
  private material: THREE.ShaderMaterial
  private depth: THREE.Texture | null = null
  private normal: THREE.Texture | null = null
  private lastTime = 0
  private ringSlot = 0
  private count: number

  constructor(opts: FaceParticlesOptions) {
    this.count = opts.count ?? DEFAULT_COUNT

    // 위치는 맵이 도착한 뒤에 채운다(가중 샘플링에 픽셀 값이 필요하다).
    // 그동안 uOpacity가 0이라 화면에는 아무것도 안 보인다.
    const positions = new Float32Array(this.count * 3)
    const seeds = new Float32Array(this.count * 4)
    for (let i = 0; i < this.count; i++) {
      seeds[i * 4] = Math.random()
      seeds[i * 4 + 1] = Math.random()
      seeds[i * 4 + 2] = Math.random()
      seeds[i * 4 + 3] = Math.random()
    }

    this.geometry = new THREE.BufferGeometry()
    // position은 three가 프러스텀 컬링에 쓰므로 같은 버퍼를 공유한다
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aInitialPos', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
    // 파티클이 바람장으로 배치 범위 밖까지 흐르므로 컬링 구를 넉넉히 잡는다
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
        // 링은 약 0.85초면 얼굴 밖으로 빠져나간다. 수명을 그보다 훨씬 길게 잡으면
        // 단어 간격(0.4~0.6초)당 링이 서너 겹씩 쌓여 다시 출렁임으로 뭉개진다
        uRingLife: { value: 1.0 },
        uRingSpeed: { value: 0.42 },
        // 띠가 두꺼우면 파문이 아니라 덩어리가 지나가는 모양이 된다
        uRingWidth: { value: 0.055 },
        uMonoColor: { value: new THREE.Color('#8302af') },
        // 밝은 쪽에 섞이는 그린 — 앱 팔레트의 emerald(#34d399)
        uAccentColor: { value: new THREE.Color('#34d399') },
        uGreenAmount: { value: 0.26 },
        // 파문이 지나갈 때의 색. 그린보다 한 단계 밝은 민트라 파문이 또렷하다.
        // 계수는 낮게 — 한 문장에 링이 서너 겹 살아 있어 합이 쉽게 1을 넘는다
        uRingColor: { value: new THREE.Color('#5ef0c0') },
        uRingTint: { value: 0.42 },
        uFaceDepth: { value: null },
        uFaceNormal: { value: null },
      },
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false

    this.loadMaps(opts.depthUrl, opts.normalUrl)
  }

  private loadMaps(depthUrl: string, normalUrl: string) {
    const load = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })

    Promise.all([load(depthUrl), load(normalUrl)])
      .then(([depthImg, normalImg]) => {
        const mk = (img: HTMLImageElement) => {
          const t = new THREE.Texture(img)
          t.minFilter = THREE.LinearFilter
          t.magFilter = THREE.LinearFilter
          t.generateMipmaps = false
          t.needsUpdate = true
          return t
        }
        this.depth = mk(depthImg)
        this.normal = mk(normalImg)
        this.material.uniforms.uFaceDepth.value = this.depth
        this.material.uniforms.uFaceNormal.value = this.normal

        this.scatter(readPixels(depthImg), readPixels(normalImg))
        gsap.to(this.material.uniforms.uOpacity, { value: 0.75, duration: 1.6, ease: 'power2.out' })
      })
      .catch(() => { /* 맵이 없으면 조용히 아무것도 그리지 않는다 */ })
  }

  /**
   * 커버리지 × 단축 가중으로 파티클을 뿌린다.
   *
   * 화면에서 잰 면적은 표면이 옆으로 누울수록 작아진다(계수 |n.z|). 균등하게
   * 뿌리면 그런 곳 — 실루엣, 콧방울, 턱선 — 이 성기게 깔려 형태가 흐려진다.
   * 1/|n.z|로 가중해 뽑으면 표면적 기준으로 고르게 깔린다.
   */
  private scatter(depthData: ImageData, normalData: ImageData) {
    const W = depthData.width
    const H = depthData.height
    const dep = depthData.data
    const nrm = normalData.data
    const nW = normalData.width

    // 누적분포를 만들어 역함수로 뽑는다 — 기각 샘플링은 커버리지가 좁을 때 느리다
    const weights = new Float32Array(W * H)
    let total = 0
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const o = j * W + i
        const cover = dep[o * 4 + 1]! / 255
        if (cover < 0.5) continue
        // 법선 맵이 다른 해상도일 수 있으므로 비율로 인덱싱한다
        const ni = Math.min(nW - 1, Math.round((i / W) * nW))
        const nj = Math.min(normalData.height - 1, Math.round((j / H) * normalData.height))
        const nz = Math.abs((nrm[(nj * nW + ni) * 4 + 2]! / 255) * 2 - 1)
        // 가중을 세게 주면(1/nz 그대로) 실루엣에 파티클이 몰려 얼굴이 테두리만
        // 남고, 평평한 이마·볼이 성겨진다. head tracking 회전이 ±30° 수준이라
        // 화면 균등에 가깝게 두고 단축 보정은 얕게만 얹는 게 형태가 잘 읽힌다
        const w = cover * (0.6 + 0.4 / Math.max(0.5, nz))
        weights[o] = w
        total += w
      }
    }
    if (total <= 0) return

    const cdf = new Float32Array(W * H)
    let acc = 0
    for (let o = 0; o < weights.length; o++) {
      acc += weights[o]!
      cdf[o] = acc / total
    }

    const pos = this.geometry.attributes.aInitialPos as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let p = 0; p < this.count; p++) {
      const u = Math.random()
      // 이분 탐색
      let lo = 0
      let hi = cdf.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (cdf[mid]! < u) lo = mid + 1
        else hi = mid
      }
      const i = lo % W
      const j = (lo / W) | 0
      // 픽셀 안에서 흔들어 격자무늬(모아레)를 없앤다
      const x = ((i + Math.random()) / W) * 2 - 1
      const y = -(((j + Math.random()) / H) * 2 - 1)
      arr[p * 3] = x
      arr[p * 3 + 1] = y
      arr[p * 3 + 2] = 0
    }
    pos.needsUpdate = true
    ;(this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  }

  get ready() {
    return !!(this.depth && this.normal)
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

  /** 문장 출력 시작/끝 — 얼굴 전체가 동심원 파문으로 진동한다 */
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
   * 단어마다 확산 파문 하나를 쏜다 — 중심에서 태어나 바깥으로 퍼지며 사라진다.
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
    this.depth?.dispose()
    this.normal?.dispose()
  }
}

export { DEFAULT_COUNT }
