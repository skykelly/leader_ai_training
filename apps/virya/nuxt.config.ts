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
      title: 'AEOLIA — 클립패스 아이리스 리빌 + SVG 일러스트 학습 클론',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Virya Energy 풍력 에너지 웹사이트의 클립패스 히어로 리빌·SVG 일러스트 애니메이션·원형 게이지 데이터 시각화 기법을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#f4f7f2' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%2310241d"/%3E%3Cg stroke="%23f2a93b" stroke-width="2" stroke-linecap="round" fill="none"%3E%3Cline x1="16" y1="16" x2="16" y2="6"/%3E%3Cline x1="16" y1="16" x2="24" y2="20"/%3E%3Cline x1="16" y1="16" x2="9" y2="22"/%3E%3C/g%3E%3Ccircle cx="16" cy="16" r="1.6" fill="%23f2a93b"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
