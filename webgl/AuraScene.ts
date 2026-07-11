import * as THREE from 'three'
import gsap from 'gsap'
import { auraVertex, auraFragment } from './shaders'
import { palettes, type PaletteName } from './palettes'

/**
 * 전역 아우라 배경 씬.
 * 풀스크린 셰이더 플레인 하나를 오소그래픽으로 렌더링하고,
 * 스크롤/마우스/팔레트를 uniform으로 흘려보낸다.
 */
export class AuraScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private material: THREE.ShaderMaterial
  private targetMouse = new THREE.Vector2(0, 0)
  private tickerFn: () => void
  private onResize: () => void
  private onPointerMove: (e: PointerEvent) => void

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.material = new THREE.ShaderMaterial({
      vertexShader: auraVertex,
      fragmentShader: auraFragment,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uIntensity: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uColorA: { value: new THREE.Color(palettes.hero[0]) },
        uColorB: { value: new THREE.Color(palettes.hero[1]) },
        uColorC: { value: new THREE.Color(palettes.hero[2]) },
        uBg: { value: new THREE.Color('#050208') },
      },
    })

    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material))

    this.onResize = () => this.resize()
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
      // 마우스는 lerp로 부드럽게 따라온다
      ;(u.uMouse.value as THREE.Vector2).lerp(this.targetMouse, 0.05)
      this.renderer.render(this.scene, this.camera)
    }
    gsap.ticker.add(this.tickerFn)
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
  }

  dispose() {
    gsap.ticker.remove(this.tickerFn)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.renderer.dispose()
    this.material.dispose()
  }
}
