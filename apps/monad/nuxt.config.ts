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
      title: 'CONDUIT — 스크롤 파이프라인 다이어그램 + 모션패스 학습 클론',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Monad(보안 데이터 파이프라인 플랫폼)의 컨셉을 바탕으로, 스크롤 연동 파이프라인 다이어그램·SVG 모션패스 파티클·노이즈→시그널 모핑 기법을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#0b0f14' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%230b0f14"/%3E%3Cpath d="M6 22 Q 16 22 16 14 Q 16 6 26 6" stroke="%2322d3ee" stroke-width="2.4" fill="none" stroke-linecap="round"/%3E%3Ccircle cx="6" cy="22" r="2.2" fill="%23ff5470"/%3E%3Ccircle cx="26" cy="6" r="2.2" fill="%2322d3ee"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
