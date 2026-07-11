export default defineNuxtConfig({
  compatibilityDate: '2026-07-11',
  ssr: false,
  devtools: { enabled: false },

  components: [{ path: '~/components', pathPrefix: false }],

  css: [
    '@fontsource-variable/space-grotesk/index.css',
    'pretendard/dist/web/variable/pretendardvariable.css',
    '~/assets/styles/main.scss',
  ],

  app: {
    head: {
      title: 'Scroll Study Library — 스크롤리텔링 학습 클론 컬렉션',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '어워드 수상 사이트들의 스크롤리텔링·인터랙션 기법을 하나씩 따라 만드는 학습 클론 라이브러리',
        },
        { name: 'theme-color', content: '#0d0e12' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%230d0e12"/%3E%3Cpath d="M8 22V10h3v12zM14.5 22V10h3v12zM21 22V10h3v12z" fill="%23b7a4ff"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
