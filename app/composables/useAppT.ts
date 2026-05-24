/** Translate outside Vue SFC setup when Nuxt app is available (client-only app). */
export function appT(key: string, params?: Record<string, unknown>): string {
  const { $i18n } = useNuxtApp()
  return $i18n.t(key, params ?? {})
}
