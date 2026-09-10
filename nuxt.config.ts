export default defineNuxtConfig({
  ssr: true,
  devtools: { enabled: true },
  modules: [],
  runtimeConfig: {
    apiBaseUrl: 'http://127.0.0.1:2000'
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls: {
          includeAbsolute: false
        }
      }
    }
  },
  css: [
    '@fontsource-variable/instrument-sans/standard.css',
    '@fontsource-variable/instrument-sans/standard-italic.css',
    '@fontsource/commit-mono/400.css',
    '@fontsource/commit-mono/500.css',
    '@fontsource/commit-mono/600.css',
    '~/assets/css/tokens.css'
  ],

  app: {
    head: {
      title: 'Looping Louie | Harness-as-a-Service for LLM workflows',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, viewport-fit=cover'
        }
      ]
    }
  }
})
