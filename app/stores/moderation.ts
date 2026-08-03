import type {
  BlockedUserRow,
  CreateContentReportPayload,
  CreateUserBlockPayload,
} from '~/types/moderation'

export const useModerationStore = defineStore('moderation', {
  state: () => ({
    blockedUserIds: [] as string[],
    blockedCookIds: [] as string[],
    loaded: false,
  }),

  getters: {
    isCookBlocked: (state) => (cookId: string) => state.blockedCookIds.includes(cookId),
    isUserBlocked: (state) => (userId: string) => state.blockedUserIds.includes(userId),
  },

  actions: {
    async refreshBlocks() {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) {
        this.blockedUserIds = []
        this.blockedCookIds = []
        this.loaded = false
        return
      }

      const nuxtApp = useNuxtApp()
      const api = nuxtApp.$api as (url: string, opts?: object) => Promise<unknown>
      const raw = await api('/moderation/blocks', { method: 'GET' })
      const envelope = raw as { data?: { items?: BlockedUserRow[] }; items?: BlockedUserRow[] }
      const items = envelope.data?.items ?? envelope.items ?? []

      this.blockedUserIds = items.map((item) => item.blockedUserId)
      this.blockedCookIds = items
        .map((item) => item.blockedUser.cook?.id)
        .filter((id): id is string => Boolean(id))
      this.loaded = true
    },

    async reportContent(payload: CreateContentReportPayload) {
      const nuxtApp = useNuxtApp()
      const api = nuxtApp.$api as (url: string, opts?: object) => Promise<unknown>
      await api('/moderation/reports', { method: 'POST', body: payload })
    },

    async blockUser(payload: CreateUserBlockPayload) {
      const nuxtApp = useNuxtApp()
      const api = nuxtApp.$api as (url: string, opts?: object) => Promise<unknown>
      await api('/moderation/blocks', { method: 'POST', body: payload })

      if (payload.blockedUserId) {
        if (!this.blockedUserIds.includes(payload.blockedUserId)) {
          this.blockedUserIds.push(payload.blockedUserId)
        }
      }
      if (payload.cookId && !this.blockedCookIds.includes(payload.cookId)) {
        this.blockedCookIds.push(payload.cookId)
      }

      await this.refreshBlocks()
    },

    clear() {
      this.blockedUserIds = []
      this.blockedCookIds = []
      this.loaded = false
    },
  },
})
