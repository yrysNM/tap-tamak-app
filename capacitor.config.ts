/// <reference types="@capacitor-community/safe-area" />

import { SystemBarsStyle } from '@capacitor-community/safe-area'
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.taptamak.app',
  appName: 'TapTamak',
  webDir: '.output/public',
  server: {
    cleartext: true,
  },
  android: {
    // Safe-area plugin handles insets; avoid double margins on Android 15+
    adjustMarginsForEdgeToEdge: 'disable',
  },
  plugins: {
    SafeArea: {
      statusBarStyle: SystemBarsStyle.Light,
      navigationBarStyle: SystemBarsStyle.Light,
      initialViewportFitCover: true,
      detectViewportFitCoverChanges: true,
    },
  },
}

export default config
