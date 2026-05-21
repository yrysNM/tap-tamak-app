import { Capacitor } from '@capacitor/core'
import { SafeArea, SystemBarsStyle } from '@capacitor-community/safe-area'

export default defineNuxtPlugin(async () => {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  document.documentElement.classList.add('capacitor-native')

  try {
    await SafeArea.setSystemBarsStyle({ style: SystemBarsStyle.Light })
  } catch (error) {
    console.warn('[safe-area] Failed to set system bar style:', error)
  }
})
