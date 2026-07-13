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
      title: 'COGENT — 실시간 3D 셰이더 히어로 학습 클론',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Lusion 스튜디오(Devin AI 웹사이트 제작사)의 실시간 3D 셰이더·스크롤 카메라 연출 기법을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#07070a' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%2307070a"/%3E%3Ccircle cx="16" cy="16" r="8" fill="none" stroke="%236df0c2" stroke-width="2"/%3E%3Ccircle cx="16" cy="16" r="2.4" fill="%236df0c2"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
