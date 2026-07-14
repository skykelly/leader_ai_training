export default defineNuxtConfig({
  compatibilityDate: '2026-07-11',
  ssr: false,
  devtools: { enabled: false },

  // scrollkit 레이어 — ScrollCursor/ScrollMagneticButton 컴포넌트,
  // splitRevealTween 컴포저블, gsap 플러그인 등록이 여기서 온다
  extends: ['scrollkit'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: [
    '@fontsource-variable/space-grotesk/index.css',
    'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css',
    '~/assets/styles/main.scss',
  ],

  app: {
    head: {
      title: 'Starter — scrollkit 스크롤리텔링 템플릿',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'packages/scrollkit의 스크롤리텔링 기법(WebGL 배경 3종, 텍스트 리빌, 커스텀 커서, 마그네틱 버튼)을 조합해 새 사이트를 시작하는 템플릿',
        },
        { name: 'theme-color', content: '#0d0e12' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%230d0e12"/%3E%3Cpath d="M9 21c3-6 5-6 7 0s4 6 7 0" fill="none" stroke="%237df0c9" stroke-width="2.2" stroke-linecap="round"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
