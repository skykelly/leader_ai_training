import type { CoreScene } from '~/webgl/CoreScene'
import type { PaletteName } from '~/webgl/palettes'

let scene: CoreScene | null = null

/** 전역 synthetic core 씬 접근자. 캔버스는 app.vue의 CoreCanvas 하나뿐이다. */
export function useCore() {
  async function init(canvas: HTMLCanvasElement) {
    if (scene) return scene
    const { CoreScene } = await import('~/webgl/CoreScene')
    scene = new CoreScene(canvas)
    return scene
  }

  function destroy() {
    scene?.dispose()
    scene = null
  }

  return {
    init,
    destroy,
    setPalette: (name: PaletteName, duration?: number) => scene?.setPalette(name, duration),
    setAmplitude: (v: number, duration?: number) => scene?.setAmplitude(v, duration),
    setGlow: (v: number, duration?: number) => scene?.setGlow(v, duration),
    setScale: (v: number, duration?: number) => scene?.setScale(v, duration),
    pulse: () => scene?.pulse(),
  }
}
