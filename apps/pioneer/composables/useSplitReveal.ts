import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

/**
 * SplitText 리빌 헬퍼.
 * 요소를 글자/행 단위로 쪼개고, 행 마스크 안에서 글자가 올라오는
 * 시그니처 리빌 트윈을 반환한다.
 */
export function splitRevealTween(
  el: HTMLElement,
  vars: gsap.TweenVars = {},
): { split: SplitText; tween: gsap.core.Tween } {
  const split = new SplitText(el, {
    type: 'lines,chars',
    linesClass: 'line',
    mask: 'lines',
  })

  const tween = gsap.from(split.chars, {
    yPercent: 115,
    duration: 1.1,
    ease: 'power4.out',
    stagger: 0.025,
    ...vars,
  })

  return { split, tween }
}
