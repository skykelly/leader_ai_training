import { Observer } from 'gsap/Observer'

/**
 * 풀페이지 슬라이드 상태 머신.
 * GSAP Observer가 휠/터치 입력을 가로채고(스크롤 하이재킹),
 * 키보드 방향키도 같은 goTo로 흘려보낸다.
 * 전환 연출(웨이브)은 onChange 콜백에 위임 — 콜백이 끝나야 다음 입력을 받는다.
 */
export function useSlider(opts: {
  count: number
  /**
   * 전환 연출 담당. 연출 중 슬라이드가 교체되어야 할 순간(웨이브가 화면을
   * 완전히 덮었을 때)에 commit()을 호출하면 index가 그 시점에 바뀐다.
   */
  onChange: (to: number, from: number, commit: () => void) => Promise<void>
}) {
  const index = ref(0)
  const busy = ref(false)

  let observer: Observer | null = null
  let onKey: ((e: KeyboardEvent) => void) | null = null

  async function goTo(to: number) {
    if (busy.value || to === index.value || to < 0 || to >= opts.count) return
    busy.value = true
    const from = index.value
    await opts.onChange(to, from, () => (index.value = to))
    if (index.value !== to) index.value = to // 연출이 commit을 빠뜨려도 상태는 보장
    busy.value = false
  }

  const next = () => goTo(index.value + 1)
  const prev = () => goTo(index.value - 1)

  function init() {
    // GSAP 공식 풀페이지 패턴: wheelSpeed -1로 휠 방향을 뒤집어
    // 휠 다운/스와이프 업 → onUp(다음 슬라이드)로 통일한다
    observer = Observer.create({
      type: 'wheel,touch',
      wheelSpeed: -1,
      tolerance: 10,
      preventDefault: true,
      onDown: () => prev(),
      onUp: () => next(),
    })

    onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        next()
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
  }

  function destroy() {
    observer?.kill()
    observer = null
    if (onKey) window.removeEventListener('keydown', onKey)
  }

  return { index, busy, goTo, next, prev, init, destroy }
}
