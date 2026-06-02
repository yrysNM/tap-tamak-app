import type {
  ApiResponse,
  CookVerificationGetResponse,
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
      if (this.user?.role === 'COOK') {
        await this.fetchVerificationStatus()
      }
    },

    async fetchVerificationStatus() {
      const nuxtApp = useNuxtApp()
      try {
        const raw = await (nuxtApp.$api as (
          url: string,
          opts: { method: string },
        ) => Promise<CookVerificationGetResponse | ApiResponse<CookVerificationGetResponse>>)(
          '/cooks/me/verification',
          { method: 'GET' },
        )
        const body =
          raw && typeof raw === 'object' && 'data' in raw
            ? raw.data
            : raw
        this.verificationStatus = body.verificationStatus
      } catch {
        // Keep session; verification screen will retry.
      }
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
      const res = await $fetch<ApiResponse<LoginResponse>>(
        `${config.public.apiBaseUrl}/auth/refresh`,
        {
          method: 'POST',
          body: { refreshToken: this.refreshToken },
        },
      )
      this.accessToken = res.data.accessToken
      this.refreshToken = res.data.refreshToken
      if (res.data.user) {
        this.user = res.data.user
      }
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

  // localStorage survives Capacitor WebView restarts; cookies do not reliably persist in the APK.
  persist: {
    key: 'auth',
    pick: ['user', 'accessToken', 'refreshToken', 'verificationStatus'],
    storage: piniaPluginPersistedstate.localStorage(),
  },
})
