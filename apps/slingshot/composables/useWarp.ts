import type { WarpScene } from '~/webgl/WarpScene'

let scene: WarpScene | null = null
let pendingBoost: number | null = null

/** 전역 워프 스피드 씬 접근자. 캔버스는 app.vue의 WarpCanvas 하나뿐이다. */
export function useWarp() {
  async function init(canvas: HTMLCanvasElement) {
    if (scene) return scene
    const { WarpScene } = await import('~/webgl/WarpScene')
    scene = new WarpScene(canvas)
    if (pendingBoost !== null) scene.setBoost(pendingBoost)
    return scene
  }

  function destroy() {
    scene?.dispose()
    scene = null
  }

  function setBoost(value: number) {
    if (scene) scene.setBoost(value)
    else pendingBoost = value
  }

  function pulse() {
    scene?.pulse()
  }

  return { init, destroy, setBoost, pulse }
}
