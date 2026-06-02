const DEFAULT_KASPI_PAYMENT_NUMBER = '+7 (777) 779-91-97'

export function useKaspiPaymentNumber() {
  const config = useRuntimeConfig()
  return computed(
    () => (config.public.kaspiPaymentNumber as string) || DEFAULT_KASPI_PAYMENT_NUMBER,
  )
}
