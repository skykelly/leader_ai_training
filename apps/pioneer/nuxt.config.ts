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
      title: 'PIONEER — 스크롤리텔링 학습 프로젝트',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'preparetopioneer.com의 스크롤리텔링·인터랙티브 기법을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#050208' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          // 인라인 data URI — base path와 무관하게 항상 해석되어 favicon 404를 피한다
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%23050208"/%3E%3Cpath d="M16 6l3.2 7.8L27 17l-7.8 3.2L16 28l-3.2-7.8L5 17l7.8-3.2z" fill="%238b5cf6"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
