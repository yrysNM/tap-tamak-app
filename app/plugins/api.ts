import type { NitroFetchRequest } from 'nitropack'
import { useAuthStore } from '../stores/auth'
import {
  getFetchErrorStatus,
  normalizeApiError,
  pathFromNitroRequest,
  shouldSkip401SessionRefresh,
} from '../utils/apiHttp'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const rawApi = $fetch.create({
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
  })

  async function api<T = unknown>(
    request: NitroFetchRequest,
    options?: Parameters<typeof $fetch>[1],
  ): Promise<T> {
    const path = pathFromNitroRequest(request)
    const run = () => rawApi<T>(request, options as Parameters<typeof rawApi>[1])

    try {
      return await run()
    } catch (err: unknown) {
      const status = getFetchErrorStatus(err)

      if (
        status === 401
        && authStore.refreshToken
        && !shouldSkip401SessionRefresh(path)
      ) {
        try {
          await authStore.refreshAccessToken()
        } catch {
          authStore.logout()
          await navigateTo('/login')
          throw normalizeApiError(err)
        }
        try {
          return await run()
        } catch (retryErr: unknown) {
          if (getFetchErrorStatus(retryErr) === 401) {
            authStore.logout()
            await navigateTo('/login')
          }
          throw normalizeApiError(retryErr)
        }
      }

      throw normalizeApiError(err)
    }
  }

  return {
    provide: {
      api: api as <T = unknown>(
        request: NitroFetchRequest,
        options?: Parameters<typeof $fetch>[1],
      ) => Promise<T>,
    },
  }
})
