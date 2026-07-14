import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

// 레이어를 extends한 앱에 gsap 플러그인을 등록한다.
// registerPlugin은 멱등이라 앱이 자체적으로 또 등록해도 안전하다.
export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText)
})
