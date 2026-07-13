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
      title: 'TACHYON — 워프 스피드 WebGL 스트릭 학습 클론',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Sling Shot Intergalactic(필름 데일리즈 글로벌 전송) 웹사이트의 워프 스피드 스트릭·떠다니는 3D 오브젝트·오버사이즈 타이포 기법을 학습하기 위한 클론 프로젝트',
        },
        { name: 'theme-color', content: '#08060f' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" rx="6" fill="%2308060f"/%3E%3Cg stroke="%2300f0ff" stroke-width="2" stroke-linecap="round"%3E%3Cline x1="6" y1="16" x2="16" y2="16"/%3E%3Cline x1="10" y1="10" x2="20" y2="16"/%3E%3Cline x1="10" y1="22" x2="20" y2="16"/%3E%3C/g%3E%3Ccircle cx="24" cy="16" r="2.4" fill="%23ff3df0"/%3E%3C/svg%3E',
        },
      ],
    },
  },
})
