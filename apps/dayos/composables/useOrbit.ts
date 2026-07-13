import type { OrbitScene } from '~/webgl/OrbitScene'

let scene: OrbitScene | null = null
let pendingProgress: number | null = null

/** 전역 오빗 링 씬 접근자. 캔버스는 app.vue의 OrbitCanvas 하나뿐이다. */
export function useOrbit() {
  async function init(canvas: HTMLCanvasElement) {
    if (scene) return scene
    const { OrbitScene } = await import('~/webgl/OrbitScene')
    scene = new OrbitScene(canvas)
    if (pendingProgress !== null) scene.setProgress(pendingProgress)
    return scene
  }

  function destroy() {
    scene?.dispose()
    scene = null
  }

  function setProgress(value: number) {
    if (scene) scene.setProgress(value)
    else pendingProgress = value
  }

  function pulse() {
    scene?.pulse()
  }

  return { init, destroy, setProgress, pulse }
}
