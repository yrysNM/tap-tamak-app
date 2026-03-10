import { storeToRefs } from 'pinia'
import type { LoginDto } from '../types'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isCook,
    // isAdmin,
  } = storeToRefs(authStore)

  async function login(credentials: LoginDto) {
    await authStore.login(credentials)
  }

  function logout() {
    authStore.logout()
  }

  async function refreshAccessToken() {
    await authStore.refreshAccessToken()
  }

  async function fetchMe() {
    await authStore.fetchMe()
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isCook,
    // isAdmin,
    login,
    logout,
    refreshAccessToken,
    fetchMe,
  }
}
