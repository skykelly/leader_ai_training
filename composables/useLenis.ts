import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let lenis: Lenis | null = null
let tickerFn: ((time: number) => void) | null = null

/**
 * Lenis 스무스 스크롤 싱글턴.
 * GSAP ticker가 rAF를 구동하고, Lenis 스크롤 이벤트가 ScrollTrigger를 갱신한다
 * — 스크롤리텔링에서 관성 스크롤과 scrub 애니메이션을 동기화하는 표준 패턴.
 */
export function useLenis() {
  function init() {
    if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
    lenis.on('scroll', ScrollTrigger.update)

    tickerFn = (time) => lenis?.raf(time * 1000)
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)
  }

  function destroy() {
    if (tickerFn) gsap.ticker.remove(tickerFn)
    lenis?.destroy()
    lenis = null
    tickerFn = null
  }

  function scrollTo(target: number | string | HTMLElement, opts?: Record<string, unknown>) {
    lenis?.scrollTo(target as never, opts as never)
  }

  return { init, destroy, scrollTo, get instance() { return lenis } }
}
