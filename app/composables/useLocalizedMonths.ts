/** Genitive month names for order date formatting (locale-aware). */
export function useLocalizedMonths() {
  const { t } = useI18n()
  return computed(() => [
    t('l_Month_jan'),
    t('l_Month_feb'),
    t('l_Month_mar'),
    t('l_Month_apr'),
    t('l_Month_may'),
    t('l_Month_jun'),
    t('l_Month_jul'),
    t('l_Month_aug'),
    t('l_Month_sep'),
    t('l_Month_oct'),
    t('l_Month_nov'),
    t('l_Month_dec'),
  ] as const)
}
