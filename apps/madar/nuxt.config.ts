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
      title: 'VECTOR — 스크롤 연동 3D 경로 카메라 학습 클론',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Madar 물류 플랫폼 웹사이트의 "경로(path)" 3D 모티프 — 스크롤에 따라 카메라가 경로를 따라 이동하는 기법을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#0a1226' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%230a1226"/%3E%3Cpath d="M6 24 C 12 22, 14 10, 26 8" fill="none" stroke="%23FF6340" stroke-width="2.4" stroke-linecap="round"/%3E%3Ccircle cx="26" cy="8" r="2.6" fill="%23FF6340"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
