import tailwindcss from '@tailwindcss/vite'

const productionApiBaseUrl =
  'https://tap-tamak-production.up.railway.app/api/v1'
const defaultApiBaseUrl =
  process.env.NODE_ENV === 'production'
    ? productionApiBaseUrl
    : 'http://192.168.10.33:3000/api/v1'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'nuxt-icon',
    '@vueuse/nuxt',
  ],
  vite: {
    plugins: [tailwindcss() as any],
  },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: defaultApiBaseUrl,
      wsUrl: process.env.NUXT_PUBLIC_WS_URL ?? 'http://192.168.10.33:3000',
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
