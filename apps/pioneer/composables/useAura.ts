import type { AuraScene, AuraMode } from '~/webgl/AuraScene'
import type { PaletteName } from '~/webgl/palettes'

let scene: AuraScene | null = null
// 씬이 아직 비동기 생성 중일 때 페이지가 먼저 setMode를 호출할 수 있어
// (예: /experience로 바로 진입) 마지막 요청을 기억해 두었다가 init 직후 적용한다
let pendingMode: AuraMode | null = null

/**
 * 전역 아우라 씬 접근자.
 * 캔버스는 app.vue의 AuraCanvas 하나뿐이고, 모든 페이지/섹션은
 * 이 컴포저블을 통해 모드·팔레트·강도를 전환한다.
 */
export function useAura() {
  async function init(canvas: HTMLCanvasElement) {
    if (scene) return scene
    const { AuraScene } = await import('~/webgl/AuraScene')
    scene = new AuraScene(canvas, pendingMode ?? 'flow')
    if (pendingMode) scene.setMode(pendingMode)
    return scene
  }

  function destroy() {
    scene?.dispose()
    scene = null
  }

  function setMode(mode: AuraMode) {
    pendingMode = mode
    scene?.setMode(mode)
  }

  return {
    init,
    destroy,
    setMode,
    setPalette: (name: PaletteName, duration?: number) => scene?.setPalette(name, duration),
    setIntensity: (v: number, duration?: number) => scene?.setIntensity(v, duration),
    setScroll: (p: number) => scene?.setScroll(p),
    pulse: () => scene?.pulse(),
  }
}
