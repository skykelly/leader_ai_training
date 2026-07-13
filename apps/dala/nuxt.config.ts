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
      title: 'LUMEN — WebGL 파티클 셰이프 모프 학습 클론',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Unseen Studio가 만든 Dala(워크플레이스 AI 검색) 웹사이트의 WebGL 파티클 셰이프 모프 기법 — 흩어진 점들이 스크롤에 따라 전구, 다시 구체로 형태를 바꾸는 연출을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#0a0a0f' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%230a0a0f"/%3E%3Ccircle cx="16" cy="13" r="8" fill="none" stroke="%23f5b942" stroke-width="2"/%3E%3Cpath d="M12 24 H20 M13 27 H19" stroke="%23f5b942" stroke-width="2" stroke-linecap="round"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
