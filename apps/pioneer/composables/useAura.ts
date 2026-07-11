import type { AuraScene } from '~/webgl/AuraScene'
import type { PaletteName } from '~/webgl/palettes'

let scene: AuraScene | null = null

/**
 * 전역 아우라 씬 접근자.
 * 캔버스는 app.vue의 AuraCanvas 하나뿐이고, 모든 페이지/섹션은
 * 이 컴포저블을 통해 팔레트·강도를 전환한다.
 */
export function useAura() {
  async function init(canvas: HTMLCanvasElement) {
    if (scene) return scene
    const { AuraScene } = await import('~/webgl/AuraScene')
    scene = new AuraScene(canvas)
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
    setIntensity: (v: number, duration?: number) => scene?.setIntensity(v, duration),
    setScroll: (p: number) => scene?.setScroll(p),
    pulse: () => scene?.pulse(),
  }
}
