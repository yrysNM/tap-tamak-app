import tailwindcss from '@tailwindcss/vite'

const productionApiBaseUrl =
  'https://tap-tamak-production.up.railway.app/api/v1'
const defaultApiBaseUrl =
  process.env.NODE_ENV === 'production' 
    ? productionApiBaseUrl
    : 'http://localhost:3000/api/v1'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'nuxt-icon',
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
  },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: defaultApiBaseUrl,
      wsUrl:  process.env.NODE_ENV === 'production' || true ? 'https://tap-tamak-production.up.railway.app' : 'http://localhost:3000',
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
    },
  },
  ssr: false,
  nitro: {
    preset: 'static',
  },
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css'
        }
      ]
    }
  }
})
