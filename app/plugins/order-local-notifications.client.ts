import { Capacitor } from '@capacitor/core'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useOrderLocalNotifications } from '~/composables/useOrderLocalNotifications'

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  const auth = useAuthStore()
  const { isAuthenticated, isCook, isAdmin, verificationStatus, user } =
    storeToRefs(auth)
  const { start, stop } = useOrderLocalNotifications()

  function shouldWatch(): boolean {
    if (!isAuthenticated.value || !user.value) return false
    if (isAdmin.value) return true
    return isCook.value && verificationStatus.value === 'APPROVED'
  }

  watch(
    [isAuthenticated, isCook, isAdmin, verificationStatus, () => user.value?.id],
    async ([authenticated]) => {
      if (authenticated && shouldWatch()) {
        await start()
        return
      }
      stop()
    },
    { immediate: true },
  )
})
