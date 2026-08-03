const DEFAULT_KASPI_PAYMENT_NUMBER = '+7 (706) 408-02-44'

export function useKaspiPaymentNumber() {
  const config = useRuntimeConfig()
  return computed(
    () => (config.public.kaspiPaymentNumber as string) || DEFAULT_KASPI_PAYMENT_NUMBER,
  )
}
