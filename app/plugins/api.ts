import type { NitroFetchRequest } from 'nitropack'
import { useAuthStore } from '../stores/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,

    onRequest({ options }) {
      const token = authStore.accessToken
      if (token) {
        options.headers = {
          ...(options.headers as unknown as Headers),
          Authorization: `Bearer ${token}`,
        } as any
      }
    },

    async onResponseError({ response }) {
      if (response.status === 401 && authStore.refreshToken) {
        try {
          await authStore.refreshAccessToken()
        } catch {
          authStore.logout()
          await navigateTo('/login')
        }
      }
    },
  })

  return {
    provide: {
      api: api as <T = unknown>(
        request: NitroFetchRequest,
        options?: Parameters<typeof $fetch>[1]
      ) => Promise<T>,
    },
  }
})
