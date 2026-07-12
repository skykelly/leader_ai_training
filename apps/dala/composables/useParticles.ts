import type { ParticleScene } from '~/webgl/ParticleScene'

let scene: ParticleScene | null = null
// 씬이 비동기로 생성되기 전에 호출될 수 있어 pending 상태로 기억해뒀다 생성 직후 재생한다
let pendingMorph: number | null = null

/** 전역 파티클 셰이프 모프 씬 접근자. 캔버스는 app.vue의 ParticleCanvas 하나뿐이다. */
export function useParticles() {
  async function init(canvas: HTMLCanvasElement) {
    if (scene) return scene
    const { ParticleScene } = await import('~/webgl/ParticleScene')
    scene = new ParticleScene(canvas)
    if (pendingMorph !== null) scene.setMorph(pendingMorph)
    return scene
  }

  function destroy() {
    scene?.dispose()
    scene = null
  }

  function setMorph(value: number) {
    if (scene) scene.setMorph(value)
    else pendingMorph = value
  }

  function pulse() {
    scene?.pulse()
  }

  return { init, destroy, setMorph, pulse }
}
