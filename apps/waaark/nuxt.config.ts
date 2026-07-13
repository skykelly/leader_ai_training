export default defineNuxtConfig({
  compatibilityDate: '2026-07-11',
  ssr: false,
  devtools: { enabled: false },

  components: [{ path: '~/components', pathPrefix: false }],

  css: [
    '@fontsource-variable/space-grotesk/index.css',
    'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css',
    '~/assets/styles/main.scss',
  ],

  app: {
    head: {
      title: 'WRK — 웨이브 스크롤리텔링 학습 클론',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'waaark.com의 풀페이지 슬라이드·SVG 웨이브 전환 기법을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#23253c' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%2323253c"/%3E%3Cpath d="M4 20 C 9 14, 13 14, 16 20 S 25 26, 28 20" stroke="%236ec8c0" stroke-width="3" fill="none" stroke-linecap="round"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
