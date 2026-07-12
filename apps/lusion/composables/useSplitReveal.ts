import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

/** 행 마스크 안에서 글자가 올라오는 리빌 트윈 헬퍼 (pioneer와 동일 패턴) */
export function splitRevealTween(el: HTMLElement, vars: gsap.TweenVars = {}) {
  const split = new SplitText(el, { type: 'lines,chars', linesClass: 'line', mask: 'lines' })
  const tween = gsap.from(split.chars, {
    yPercent: 115,
    duration: 1.1,
    ease: 'power4.out',
    stagger: 0.02,
    ...vars,
  })
  return { split, tween }
}
