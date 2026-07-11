export default defineNuxtConfig({
  compatibilityDate: '2026-07-11',
  ssr: false,
  devtools: { enabled: false },

  css: [
    '@fontsource-variable/space-grotesk/index.css',
    'pretendard/dist/web/variable/pretendardvariable.css',
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
    },
  },
})
