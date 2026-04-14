import type {
  ApiResponse,
  LoginDto,
  LoginResponse,
  RegisterDto,
  User,
  VerificationStatus,
} from '../types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
    verificationStatus: null as VerificationStatus | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    isCook: (state) => state.user?.role === 'COOK',
  },

  actions: {
    async login(credentials: LoginDto) {
      const nuxtApp = useNuxtApp()
      const res = await (nuxtApp.$api as (url: string, opts: { method: string; body: LoginDto }) => Promise<ApiResponse<LoginResponse>>)(
        '/auth/login',
        { method: 'POST', body: credentials }
      )
      this.accessToken = res.data.accessToken
      this.refreshToken = res.data.refreshToken
      this.user = res.data.user
      const loginUser = res.data.user as User & {
        cook?: { verificationStatus?: VerificationStatus }
      }
      this.verificationStatus = loginUser.cook?.verificationStatus ?? null
    },

    async register(dto: RegisterDto) {
      const nuxtApp = useNuxtApp()
      await (nuxtApp.$api as (url: string, opts: { method: string; body: RegisterDto }) => Promise<void>)(
        '/auth/register',
        { method: 'POST', body: dto }
      )
    },

    async refreshAccessToken() {
      const config = useRuntimeConfig()
      const res = await $fetch<{ accessToken: string; refreshToken: string }>(
        `${config.public.apiBaseUrl}/auth/refresh`,
        {
          method: 'POST',
          body: { refreshToken: this.refreshToken },
        }
      )
      this.accessToken = res.accessToken
      this.refreshToken = res.refreshToken
    },

    logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.verificationStatus = null
    },

    setVerificationStatus(status: VerificationStatus | null) {
      this.verificationStatus = status
    },
  },

  // Use Nuxt default (cookies via pinia-plugin-persistedstate) so SSR + middleware
  // see the same session after refresh. localStorage-only breaks isAuthenticated on the server.
  persist: {
    key: 'auth',
    pick: ['user', 'accessToken', 'refreshToken', 'verificationStatus'],
  },
})
