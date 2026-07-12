import type { JourneyScene } from '~/webgl/JourneyScene'

let scene: JourneyScene | null = null
// 씬이 비동기로 생성되기 전에 호출될 수 있어 pending 상태로 기억해뒀다 생성 직후 재생한다
// (pioneer의 useAura.ts에서 겪은 초기화 레이스 버그와 동일한 패턴을 미리 방지)
let pendingProgress: number | null = null
let pendingNode: number | null = null

/** 전역 경로(journey) 씬 접근자. 캔버스는 app.vue의 JourneyCanvas 하나뿐이다. */
export function useJourney() {
  async function init(canvas: HTMLCanvasElement) {
    if (scene) return scene
    const { JourneyScene } = await import('~/webgl/JourneyScene')
    scene = new JourneyScene(canvas)
    if (pendingProgress !== null) scene.setProgress(pendingProgress)
    if (pendingNode !== null) scene.setActiveNode(pendingNode)
    return scene
  }

  function destroy() {
    scene?.dispose()
    scene = null
  }

  function setProgress(t: number) {
    if (scene) scene.setProgress(t)
    else pendingProgress = t
  }

  function setActiveNode(index: number) {
    if (scene) scene.setActiveNode(index)
    else pendingNode = index
  }

  return { init, destroy, setProgress, setActiveNode }
}
