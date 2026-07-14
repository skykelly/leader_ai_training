import { defineNuxtConfig } from 'nuxt/config'

/**
 * scrollkit — 스크롤리텔링 기법 공유 레이어.
 * 소비 앱의 nuxt.config에서 `extends: ['scrollkit']` 한 줄이면
 * components/(ScrollCursor, ScrollMagneticButton)와 composables/(splitRevealTween)가
 * 자동 임포트되고, plugins/의 gsap 플러그인 등록이 함께 적용된다.
 * WebGL 씬은 번들 분리를 위해 명시적 dynamic import로 쓴다:
 *   const { FlowScene } = await import('scrollkit/webgl/FlowScene')
 */
export default defineNuxtConfig({
  components: [{ path: './components', pathPrefix: false }],
})
