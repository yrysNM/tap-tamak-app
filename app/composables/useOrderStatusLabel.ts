import type { OrderStatus } from '~/types'

const STATUS_KEYS: Record<string, string> = {
  PENDING: 'l_Order_status_pending',
  AWAITING_COOK_ACCEPTANCE: 'l_Order_status_awaiting_cook',
  AWAITING_PAYMENT: 'l_Order_status_awaiting_payment',
  CONFIRMED: 'l_Order_status_confirmed',
  COOKING: 'l_Order_status_cooking',
  PREPARING: 'l_Order_status_cooking',
  READY: 'l_Order_status_ready',
  COURIER_NEARBY: 'l_Order_status_courier_nearby',
  ON_THE_WAY: 'l_Order_status_on_the_way',
  DELIVERED: 'l_Order_status_delivered',
  COMPLETED: 'l_Order_status_delivered',
  REJECTED: 'l_Order_status_rejected',
  CANCELLED: 'l_Order_status_cancelled',
}

export function orderStatusLabelKey(
  status: OrderStatus | string | undefined | null,
): string {
  const key = STATUS_KEYS[(status ?? '').toString().toUpperCase()]
  return key ?? ((status ?? '').toString() || '—')
}

export function useOrderStatusLabel() {
  const { t } = useI18n()
  return (status: OrderStatus | string | undefined | null) => {
    const key = orderStatusLabelKey(status)
    if (key.startsWith('l_')) return t(key)
    return key
  }
}
