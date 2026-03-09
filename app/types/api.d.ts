import type { NitroFetchRequest } from 'nitropack'

declare module '#app' {
  interface NuxtApp {
    $api: <T = unknown>(
      request: NitroFetchRequest,
      options?: Parameters<typeof $fetch>[1]
    ) => Promise<T>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: NuxtApp['$api']
  }
}

export {}
