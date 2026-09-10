import tailwindcss from '@tailwindcss/vite'

const productionApiBaseUrl =
  'https://tap-tamak-production.up.railway.app/api/v1'
const defaultApiBaseUrl =
  process.env.NODE_ENV === 'production'
    ? productionApiBaseUrl
    : 'http://192.168.50.117:3000/api/v1'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
  ],
  i18n: {
    restructureDir: false,
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'kk', name: 'Қазақша', file: 'kk.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'ru',
    lazy: true,
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'ru',
    },
    vueI18n: 'i18n.config.ts',
  },
  vite: {
    plugins: [tailwindcss() as any],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/@vue-leaflet')) {
              return 'leaflet'
            }
            if (id.includes('node_modules/leaflet.markercluster')) {
              return 'leaflet-cluster'
            }
            if (id.includes('node_modules/v-calendar') || id.includes('node_modules/@popperjs')) {
              return 'v-calendar'
            }
            if (id.includes('node_modules/docx-preview')) {
              return 'docx-preview'
            }
          },
        },
      },
    },
  },
  css: ['~/assets/css/main.css', '~/assets/css/safe-area.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: defaultApiBaseUrl,
      wsUrl: process.env.NODE_ENV === 'production' ? 'https://tap-tamak-production.up.railway.app' : 'http://192.168.50.117:3000',
      supportPhone: process.env.NUXT_PUBLIC_SUPPORT_PHONE ?? '+77064080244',
      legalTermsVersion: process.env.NUXT_PUBLIC_LEGAL_TERMS_VERSION ?? '2026-06-28',
      legalPrivacyVersion: process.env.NUXT_PUBLIC_LEGAL_PRIVACY_VERSION ?? '2026-06-28',
    },
  },
  ssr: false,
  piniaPluginPersistedstate: {
    storage: 'localStorage',
  },
  nitro: {
    preset: 'static',
  },
  app: {
    head: {
      meta: [
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no',
        },
      ],
    }
  }
})
