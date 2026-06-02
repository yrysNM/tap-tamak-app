type ApiRequest = (url: string, opts?: object) => Promise<unknown>

function unwrapBody<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (d !== undefined) return d as T
  }
  return raw as T
}

export interface CookDashboardStats {
  rating: number
  totalReviews: number
  countDishes: number
  menuDishesToday: number
  ordersToday: number
  pendingOrders: number
  revenueToday: number
  revenueTotal: number
  commissionToday: number
  commissionTotal: number
  netPayoutToday: number
  netPayoutTotal: number
  completedOrdersToday: number
  isActiveNow: boolean
}

export async function fetchCookDashboardStats(
  api: ApiRequest,
): Promise<CookDashboardStats> {
  const raw = await api('/cooks/me/stats', { method: 'GET' })
  return unwrapBody<CookDashboardStats>(raw)
}
