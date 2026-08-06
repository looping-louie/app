export default defineNuxtConfig({
  ssr: true,
  devtools: { enabled: true },
  modules: [],
  css: ['~/assets/css/tokens.css'],

  routeRules: {
    '/api/**': {
      proxy: 'http://127.0.0.1:8000/api/**'
    }
  },

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
