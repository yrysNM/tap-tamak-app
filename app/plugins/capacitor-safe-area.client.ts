import { Capacitor } from '@capacitor/core'
import { SafeArea, SystemBarsStyle } from '@capacitor-community/safe-area'

function ensureViewportFitCover() {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'viewport'
    document.head.appendChild(meta)
  }

  const content = meta.content || 'width=device-width, initial-scale=1.0'
  if (!content.includes('viewport-fit=cover')) {
    const trimmed = content.replace(/,\s*$/, '')
    meta.content = `${trimmed}, viewport-fit=cover`
  }
}

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  ensureViewportFitCover()
  document.documentElement.classList.add('capacitor-native')

  SafeArea.setSystemBarsStyle({ style: SystemBarsStyle.Light }).catch((error) => {
    console.warn('[safe-area] Failed to set system bar style:', error)
  })
})
