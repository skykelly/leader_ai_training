import type { AuraScene, AuraMode } from '~/webgl/AuraScene'
import type { PaletteName } from '~/webgl/palettes'

let scene: AuraScene | null = null
// 씬이 아직 비동기 생성 중일 때 페이지가 먼저 모드/팔레트/강도를 호출할 수 있어
// (예: /experience로 바로 진입) 마지막 요청을 기억해 두었다가 init 직후 재생한다.
// 이게 없으면 scene이 null인 동안의 호출은 조용히 무시되고, 씬은 생성자 기본값
// (hero 팔레트 등)으로 남아버린다.
let pendingMode: AuraMode | null = null
let pendingPalette: { name: PaletteName; duration?: number } | null = null
let pendingIntensity: { value: number; duration?: number } | null = null

/**
 * 전역 아우라 씬 접근자.
 * 캔버스는 app.vue의 AuraCanvas 하나뿐이고, 모든 페이지/섹션은
 * 이 컴포저블을 통해 모드·팔레트·강도를 전환한다.
 */
export function useAura() {
  async function init(canvas: HTMLCanvasElement) {
    if (scene) return scene
    const { AuraScene } = await import('~/webgl/AuraScene')
    scene = new AuraScene(canvas, pendingMode ?? 'flow', pendingPalette?.name ?? 'hero')
    if (pendingMode) scene.setMode(pendingMode)
    if (pendingPalette) scene.setPalette(pendingPalette.name, pendingPalette.duration)
    if (pendingIntensity) scene.setIntensity(pendingIntensity.value, pendingIntensity.duration)
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

  function setPalette(name: PaletteName, duration?: number) {
    pendingPalette = { name, duration }
    scene?.setPalette(name, duration)
  }

  function setIntensity(value: number, duration?: number) {
    pendingIntensity = { value, duration }
    scene?.setIntensity(value, duration)
  }

  return {
    init,
    destroy,
    setMode,
    setPalette,
    setIntensity,
    setScroll: (p: number) => scene?.setScroll(p),
    pulse: () => scene?.pulse(),
  }
}
