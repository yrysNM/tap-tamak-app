import type { User } from '../types'
import type { LoginDto, LoginResponse, RegisterDto } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const isCook = computed(() => user.value?.role === 'COOK')
  // const isAdmin = computed(() => user.value?.role === 'ADMIN')

  async function login(credentials: LoginDto) {
    const nuxtApp = useNuxtApp()
    const res = await (nuxtApp.$api as (url: string, opts: { method: string; body: LoginDto }) => Promise<LoginResponse>)(
      '/auth/login',
      { method: 'POST', body: credentials }
    )
    accessToken.value = res.accessToken
    refreshToken.value = res.refreshToken
    await fetchMe()
  }

  async function register(dto: RegisterDto) {
    const nuxtApp = useNuxtApp()
    await (nuxtApp.$api as (url: string, opts: { method: string; body: RegisterDto }) => Promise<void>)(
      '/auth/register',
      { method: 'POST', body: dto }
    )
  }

  async function refreshAccessToken() {
    const config = useRuntimeConfig()
    const res = await $fetch<{ accessToken: string; refreshToken: string }>(
      `${config.public.apiBaseUrl}/auth/refresh`,
      {
        method: 'POST',
        body: { refreshToken: refreshToken.value },
      }
    )
    accessToken.value = res.accessToken
    refreshToken.value = res.refreshToken
  }

  async function fetchMe() {
    const nuxtApp = useNuxtApp()
    const res = await (nuxtApp.$api as (url: string) => Promise<{ data: User }>)('/auth/me')
    user.value = res.data
  }

  function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isCook,
    // isAdmin,
    login,
    register,
    logout,
    refreshAccessToken,
    fetchMe,
  }
}, {
  persist: true,
})
