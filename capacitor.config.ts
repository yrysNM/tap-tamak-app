import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.company.appname',
  appName: 'TapTamakUI',
  webDir: '.output/public',
  server: {
    cleartext: true,
  },
}

export default config
