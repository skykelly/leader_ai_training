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
      title: 'NEXUS — 3D 오빗 링 스크롤 학습 클론',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Dayos(멀티클라우드 AI 통합 플랫폼) 웹사이트의 3D 오빗 링(통합 아이콘이 AI 코어를 도는 궤도) + 스크롤 연동 카메라 돌리 기법을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#0b0b0c' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%230b0b0c"/%3E%3Ccircle cx="16" cy="16" r="3.2" fill="%23c8ff4d"/%3E%3Cellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="%23c8ff4d" stroke-width="1.4" opacity="0.7"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
