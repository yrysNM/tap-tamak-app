/** Native display name for the active i18n locale (from nuxt.config locales). */
export function useLocaleDisplayName() {
  const { locale, locales } = useI18n()

  const currentLocaleName = computed(() => {
    const match = locales.value.find((l) => l.code === locale.value)
    return match?.name ?? locale.value
  })

  return { currentLocaleName }
}
