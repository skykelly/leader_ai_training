import * as THREE from 'three'
import gsap from 'gsap'
import { faceParticleVertex, faceParticleFragment, FACE_RINGS } from './faceParticleShaders'
import { contourPoint, interiorPoint, makeArcSampler, HALF_H } from './contourShape'

/**
 * 얼굴 윤곽 파티클.
 *
 * 이목구비를 버리고 윤곽선(계란형 + V라인)만 남긴 구성이다. 형태는
 * `contourShape.ts`의 수식으로 정의되고, 파티클은 그 곡선 위에 직접 뿌려진다.
 *
 * 격자를 깔고 텍스처로 마스킹하는 방식이었다면 윤곽선만 남길 때 파티클의
 * 90% 이상이 버려진다. 곡선 위에 바로 배치하면 전부 화면에 쓰인다.
 *
 * 파티클의 대부분은 윤곽선을 이루고, 나머지 소수가 내부에 옅게 깔려
 * 선이 허공에 뜬 고리가 아니라 얼굴의 실루엣으로 읽히게 한다.
 */

const DEFAULT_COUNT = 30000
/** 내부 헤이즈 비율 — 높이면 채워진 실루엣, 0이면 순수한 선 */
const HAZE_RATIO = 0.14
/** 윤곽선 두께(법선 방향 표준편차) */
const CONTOUR_JITTER = 0.011

export interface FaceParticlesOptions {
  /** 저사양/모바일에서 줄이기 위한 파티클 수 */
  count?: number
}

/** GLSL smoothstep과 같은 보간 */
function smooth01(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** Box–Muller — 윤곽선 두께를 자연스럽게 하려면 균등난수가 아니라 정규분포여야 한다 */
function gaussian() {
  let u = 0
  while (u === 0) u = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random())
}

export class FaceParticles {
  readonly points: THREE.Points
  private geometry: THREE.BufferGeometry
  private material: THREE.ShaderMaterial
  private lastTime = 0
  private ringSlot = 0

  constructor(opts: FaceParticlesOptions = {}) {
    const count = opts.count ?? DEFAULT_COUNT

    const positions = new Float32Array(count * 3)
    const tangents = new Float32Array(count * 2)
    // 정수리(0)에서 턱(1)까지의 위치 — 파문이 선을 따라 내려가는 좌표
    const arcs = new Float32Array(count)
    const kinds = new Float32Array(count)
    const seeds = new Float32Array(count * 4)

    const EPS = 1e-3
    // θ 균등 샘플링은 곡률이 큰 정수리·턱에 점을 뭉치게 한다 — 호길이 기준으로 뽑는다
    const arc = makeArcSampler()
    for (let i = 0; i < count; i++) {
      const haze = i % 100 < HAZE_RATIO * 100
      const theta = arc.sample(Math.random())
      const p = contourPoint(theta)
      const q = contourPoint(theta + EPS)
      // 접선: 곡선 방향. 법선은 그것의 수직
      let tx = q.x - p.x
      let ty = q.y - p.y
      const tl = Math.hypot(tx, ty) || 1
      tx /= tl
      ty /= tl
      // 정수리·턱 끝은 접선이 수평이라 흐름이 곡선 밖으로 빠져나가 X자로 교차한다.
      // 끝점에 가까울수록 흐름을 죽여 선이 닫힌 채로 흐르게 한다.
      // (셰이더는 이 길이를 그대로 변위에 쓰므로 접선에 가중치를 실어 보낸다)
      const tipFade = 1 - smooth01(0.62, 0.97, Math.abs(p.y) / HALF_H)
      tx *= tipFade
      ty *= tipFade

      let x: number
      let y: number
      let z: number
      if (haze) {
        // 내부는 면적이 고르게 차도록 √u로 반지름을 뽑는다
        const rNorm = Math.sqrt(Math.random()) * 0.94
        const ip = interiorPoint(theta, rNorm)
        x = ip.x
        y = ip.y
        // 안쪽일수록 앞으로 나온 돔 — 회전할 때 입체로 읽힌다
        z = Math.sqrt(Math.max(0, 1 - rNorm * rNorm)) * 0.34
      } else {
        // 윤곽선은 실루엣이므로 z≈0. 법선 방향으로만 두께를 준다
        const off = gaussian() * CONTOUR_JITTER
        x = p.x + -ty * off
        y = p.y + tx * off
        z = gaussian() * 0.012
      }

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      tangents[i * 2] = tx
      tangents[i * 2 + 1] = ty
      kinds[i] = haze ? 1 : 0
      arcs[i] = arc.arcFromCrown(theta)
      seeds[i * 4] = Math.random()
      seeds[i * 4 + 1] = Math.random()
      seeds[i * 4 + 2] = Math.random()
      seeds[i * 4 + 3] = Math.random()
    }

    this.geometry = new THREE.BufferGeometry()
    // position은 three가 프러스텀 컬링에 쓰므로 기준 위치를 그대로 넣어둔다
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aInitialPos', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aTangent', new THREE.BufferAttribute(tangents, 2))
    this.geometry.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1))
    this.geometry.setAttribute('aArc', new THREE.BufferAttribute(arcs, 1))
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
    // 파티클이 흐름을 따라 기준 위치 밖까지 나가므로 컬링 구를 넉넉히 잡는다
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), HALF_H * 3)

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
        uParticleScale: { value: 9 },
        uScaleVariation: { value: 1.4 },
        uNoiseFrequency: { value: 1.1 },
        uNoiseIntensity: { value: 0.02 },
        uFlowSpeed: { value: 0.075 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uYaw: { value: 0 },
        uPitch: { value: 0 },
        uExplosion: { value: 0 },
        uOpacity: { value: 0 }, // 페이드인으로 올린다
        uHazeOpacity: { value: 0.28 },
        uTypeFactor: { value: 0 },
        uTypePulse: { value: 0 },
        // 비활성 링은 큰 음수 — 나이가 수명을 넘어 셰이더에서 걸러진다
        uRingT: { value: new Array(FACE_RINGS).fill(-999) },
        uRingLife: { value: 1.5 },
        uRingSpeed: { value: 0.8 },
        uRingWidth: { value: 0.1 },
        uMonoColor: { value: new THREE.Color('#8302af') },
      },
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false

    // 로드할 텍스처가 없으므로 바로 나타난다
    gsap.to(this.material.uniforms.uOpacity, { value: 0.72, duration: 1.6, ease: 'power2.out' })
  }

  get ready() {
    return true
  }

  update(time: number, mouseX: number, mouseY: number) {
    const u = this.material.uniforms
    u.uTime.value = time
    // 링 발사는 렌더 루프 밖(타이핑 콜백)에서 오므로 마지막 시각을 기억해 둔다
    this.lastTime = time
    // 커서 방향으로 고개를 돌린다
    u.uYaw.value += (mouseX * 0.52 - u.uYaw.value) * 0.06
    u.uPitch.value += (-mouseY * 0.28 - u.uPitch.value) * 0.06
  }

  /** 팔레트 색으로 윤곽을 물들인다 */
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

  /** 문장 출력 시작/끝 */
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
   * 슬롯을 돌려 쓰므로 FACE_RINGS개까지 겹쳐 살아 있을 수 있다.
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
  }
}

export { DEFAULT_COUNT }
