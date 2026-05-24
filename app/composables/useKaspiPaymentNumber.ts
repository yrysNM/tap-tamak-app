const DEFAULT_KASPI_PAYMENT_NUMBER = '+7 (700) 000-00-00'

export function useKaspiPaymentNumber() {
  const config = useRuntimeConfig()
  return computed(
    () => (config.public.kaspiPaymentNumber as string) || DEFAULT_KASPI_PAYMENT_NUMBER,
  )
}
