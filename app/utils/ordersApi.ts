import type { Cook, Order, OrderItem, OrderStatus } from '~/types'

type ApiRequest = (url: string, opts?: object) => Promise<unknown>

function unwrapBody<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (d !== undefined) return d as T
  }
  return raw as T
}

/** Russian label for every known order status; unknown values fall back to the raw code. */
export function orderStatusLabel(status: OrderStatus | string | undefined | null): string {
  switch ((status ?? '').toString().toUpperCase()) {
    case 'PENDING':
      return 'В ожидании'
    case 'AWAITING_COOK_ACCEPTANCE':
      return 'Ждем ответа от повара'
    case 'AWAITING_PAYMENT':
      return 'Ждем оплаты'
    case 'CONFIRMED':
      return 'Подтвержден'
    case 'COOKING':
    case 'PREPARING':
      return 'Готовится'
    case 'READY':
      return 'Готов к выдаче'
    case 'COURIER_NEARBY':
      return 'Курьер рядом'
    case 'ON_THE_WAY':
      return 'В пути'
    case 'DELIVERED':
    case 'COMPLETED':
      return 'Доставлен'
    case 'REJECTED':
      return 'Отклонен'
    case 'CANCELLED':
      return 'Отменен'
    default:
      return (status ?? '').toString() || '—'
  }
}

export type OrderStatusTone = 'warning' | 'success' | 'danger'

/** Visual tone used for the status pill in the orders list. */
export function orderStatusTone(status: OrderStatus | string | undefined | null): OrderStatusTone {
  switch ((status ?? '').toString().toUpperCase()) {
    case 'READY':
    case 'COURIER_NEARBY':
    case 'ON_THE_WAY':
    case 'DELIVERED':
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
    case 'REJECTED':
      return 'danger'
    default:
      return 'warning'
  }
}

/** True when the customer can confirm or dispute a delivered order. */
export function isOrderDelivered(status: OrderStatus | string | undefined | null): boolean {
  return (status ?? '').toString().toUpperCase() === 'DELIVERED'
}

/** Statuses for which the user can still cancel the order. */
export function isOrderCancellable(status: OrderStatus | string | undefined | null): boolean {
  switch ((status ?? '').toString().toUpperCase()) {
    case 'PENDING':
    case 'AWAITING_COOK_ACCEPTANCE':
    case 'AWAITING_PAYMENT':
      return true
    default:
      return false
  }
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function parseOrderItem(raw: unknown): OrderItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = asString(o.id)
  const dishId = asString(o.dishId ?? (o.dish as Record<string, unknown> | undefined)?.id)
  if (!id || !dishId) return null
  const name = asString(o.name ?? (o.dish as Record<string, unknown> | undefined)?.name, '')
  const dishRaw = o.dish && typeof o.dish === 'object' ? (o.dish as Record<string, unknown>) : null
  return {
    id,
    dishId,
    quantity: Math.max(0, Math.trunc(asNumber(o.quantity, 1))),
    price: asNumber(o.price ?? o.unitPrice ?? dishRaw?.price, 0),
    name,
    dish: dishRaw
      ? ({
          id: asString(dishRaw.id, dishId),
          cookId: asString(dishRaw.cookId, ''),
          name: asString(dishRaw.name, name),
          description:
            typeof dishRaw.description === 'string' ? dishRaw.description : undefined,
          price: asNumber(dishRaw.price, 0),
          imageUrl: typeof dishRaw.imageUrl === 'string' ? dishRaw.imageUrl : undefined,
          category: asString(dishRaw.category, ''),
          tags: Array.isArray(dishRaw.tags) ? (dishRaw.tags as string[]) : [],
          isAvailable:
            typeof dishRaw.isAvailable === 'boolean' ? dishRaw.isAvailable : true,
          rating: asNumber(dishRaw.rating, 0),
          orderCount: asNumber(dishRaw.orderCount, 0),
        })
      : undefined,
  }
}

function parseCook(raw: unknown): Cook | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const c = raw as Record<string, unknown>
  if (!c.id || !c.businessName) return undefined
  return {
    id: asString(c.id),
    userId: asString(c.userId, ''),
    businessName: asString(c.businessName),
    profileImageUrl:
      typeof c.profileImageUrl === 'string' ? c.profileImageUrl : undefined,
    bio: typeof c.bio === 'string' ? c.bio : undefined,
    specialties: Array.isArray(c.specialties) ? (c.specialties as string[]) : [],
    kitchenPhotoUrls: Array.isArray(c.kitchenPhotoUrls)
      ? (c.kitchenPhotoUrls.filter((u) => typeof u === 'string') as string[])
      : [],
    verificationStatus: (c.verificationStatus as Cook['verificationStatus']) ?? 'PENDING',
    isAvailable: typeof c.isAvailable === 'boolean' ? c.isAvailable : true,
    latitude: typeof c.latitude === 'number' ? c.latitude : undefined,
    longitude: typeof c.longitude === 'number' ? c.longitude : undefined,
    preparationTimeMin: asNumber(c.preparationTimeMin, 0),
    minimumOrder: asNumber(c.minimumOrder, 0),
    deliveryRadius: asNumber(c.deliveryRadius, 0),
    rating: asNumber(c.rating, 0),
    totalReviews: Math.max(0, Math.trunc(asNumber(c.totalReviews, 0))),
  }
}

function parseOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = asString(o.id)
  if (!id) return null
  const itemsRaw = Array.isArray(o.items) ? o.items : []
  const items = itemsRaw
    .map((row) => parseOrderItem(row))
    .filter((x): x is OrderItem => x != null)
  return {
    id,
    orderNumber: asString(o.orderNumber, id),
    userId: asString(o.userId, ''),
    cookId: asString(o.cookId, ''),
    status: ((o.status as string) ?? 'PENDING') as OrderStatus,
    totalAmount: asNumber(o.totalAmount ?? o.itemsTotal, 0),
    deliveryFee: asNumber(o.deliveryFee, 0),
    deliveryAddress: asString(o.deliveryAddress, ''),
    contactPhone:
      typeof o.contactPhone === 'string' && o.contactPhone.trim()
        ? o.contactPhone.trim()
        : undefined,
    paymentStatus:
      ((o.paymentStatus as string) ?? 'PENDING') as Order['paymentStatus'],
    items,
    cook: parseCook(o.cook),
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : undefined,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : undefined,
    estimatedMinutes:
      typeof o.estimatedMinutes === 'number'
        ? o.estimatedMinutes
        : typeof o.preparationTimeMin === 'number'
          ? o.preparationTimeMin
          : null,
  }
}

export interface FetchOrdersParams {
  page?: number
  limit?: number
  /** Filter by status, e.g. `AWAITING_COOK_ACCEPTANCE` for incoming cook requests. */
  status?: OrderStatus | string
}

function buildOrdersQuery(params?: FetchOrdersParams): string {
  if (!params) return ''
  const search = new URLSearchParams()
  if (params.page != null && Number.isFinite(params.page)) {
    search.set('page', String(Math.max(1, Math.trunc(params.page))))
  }
  if (params.limit != null && Number.isFinite(params.limit)) {
    search.set('limit', String(Math.max(1, Math.trunc(params.limit))))
  }
  const st = params.status != null ? String(params.status).trim() : ''
  if (st) search.set('status', st)
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/** GET /orders — list orders for the current user, cook, or admin; optional `status`, `page`, `limit`. Newest first when timestamps exist. */
export async function fetchOrders(
  api: ApiRequest,
  params?: FetchOrdersParams,
): Promise<Order[]> {
  const raw = await api(`/orders${buildOrdersQuery(params)}`, { method: 'GET' })
  const body = unwrapBody<unknown>(raw)
  const list = Array.isArray(body)
    ? body
    : Array.isArray((body as { items?: unknown[] })?.items)
      ? ((body as { items: unknown[] }).items)
      : Array.isArray((body as { data?: unknown[] })?.data)
        ? ((body as { data: unknown[] }).data)
        : []
  const orders = list
    .map((row) => parseOrder(row))
    .filter((x): x is Order => x != null)
  orders.sort((a, b) => {
    const av = a.createdAt ? Date.parse(a.createdAt) : 0
    const bv = b.createdAt ? Date.parse(b.createdAt) : 0
    return bv - av
  })
  return orders
}

/** POST /orders/:id/cancel — cancel an order while it is still cancellable. */
export async function cancelOrderById(api: ApiRequest, orderId: string): Promise<void> {
  await api(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' })
}

/** Customer confirms a delivered order. POST /orders/:id/delivery/accept */
export async function acceptDeliveredOrder(api: ApiRequest, orderId: string): Promise<void> {
  await api(`/orders/${encodeURIComponent(orderId)}/delivery/accept`, { method: 'POST' })
}

/** Customer rejects a delivered order. POST /orders/:id/delivery/reject — JSON `{ reason }`. */
export async function rejectDeliveredOrder(
  api: ApiRequest,
  orderId: string,
  payload: { reason: string },
): Promise<void> {
  await api(`/orders/${encodeURIComponent(orderId)}/delivery/reject`, {
    method: 'POST',
    body: payload,
  })
}

/**
 * Cook accepts an order awaiting cook (sets preparation time → COOKING).
 * POST /orders/:id/accept — JSON `{ preparationTimeMinutes }` (OpenAPI: /api/v1/orders/{id}/accept).
 */
export async function acceptOrderByCook(
  api: ApiRequest,
  orderId: string,
  payload: { preparationTimeMinutes: number },
): Promise<void> {
  await api(`/orders/${encodeURIComponent(orderId)}/accept`, {
    method: 'POST',
    body: payload,
  })
}

/** Cook rejects an order awaiting cook. POST /orders/:id/reject — JSON `{ reason }`. */
export async function rejectOrderByCook(
  api: ApiRequest,
  orderId: string,
  payload: { reason: string },
): Promise<void> {
  await api(`/orders/${encodeURIComponent(orderId)}/reject`, {
    method: 'POST',
    body: payload,
  })
}

export interface CheckoutOrderPayload {
  addressLine: string
  city?: string
  entrance?: string
  intercom?: string
  floor?: string
  apartment?: string
  contactPhone: string
  saveAddress?: boolean
  savedAddressLabel?: string
  discountAmount?: number
  courierComment?: string
}

export interface PrepareOrderCook {
  id: string
  businessName: string
  rating: number
  chefFirstName?: string
  chefLastName?: string
}

export interface PrepareOrderLine {
  dishId: string
  name: string
  quantity: number
  unitPrice: number
  lineSubtotal: number
}

export interface PrepareOrderResponse {
  basketId: string
  cook: PrepareOrderCook
  delivery: Record<string, unknown>
  items: PrepareOrderLine[]
  itemsTotal: number
  platformFeePercent: number
  platformFee: number
  deliveryFee: number
  discountAmount: number
  totalAmount: number
}

export async function prepareOrderFromCart(
  api: ApiRequest,
  payload: CheckoutOrderPayload,
): Promise<PrepareOrderResponse> {
  const raw = await api(`/orders/prepare`, {
    method: 'POST',
    body: payload,
  })
  return unwrapBody<PrepareOrderResponse>(raw)
}

/** POST /api/v1/orders — create order from server cart (checkout JSON). */
export async function createOrderFromCart(
  api: ApiRequest,
  payload: CheckoutOrderPayload,
): Promise<{ orderId: string }> {
  const raw = await api(`/orders`, {
    method: 'POST',
    body: payload,
  })
  return unwrapBody<{ orderId: string }>(raw)
}

const MULTIPART_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_CHECKOUT_PHOTO_BYTES = 8 * 1024 * 1024

export function validateCheckoutPhoto(file: File): string | null {
  if (!file || file.size === 0) return 'Прикрепите фото чека (JPEG, PNG или WebP).'
  if (!MULTIPART_IMAGE_TYPES.has(file.type)) {
    return 'Фото должно быть в формате JPEG, PNG или WebP.'
  }
  if (file.size > MAX_CHECKOUT_PHOTO_BYTES) {
    return 'Размер фото не должен превышать 8 МБ.'
  }
  return null
}

/** POST /orders/checkout-multipart — same address rules as JSON checkout; photo required; no courier comment server-side. */
export function buildCheckoutMultipartFormData(
  payload: CheckoutOrderPayload,
  photo: File,
): FormData {
  const fd = new FormData()
  fd.append('addressLine', payload.addressLine)
  if (payload.city?.trim()) fd.append('city', payload.city.trim())
  if (payload.entrance?.trim()) fd.append('entrance', payload.entrance.trim())
  if (payload.intercom?.trim()) fd.append('intercom', payload.intercom.trim())
  if (payload.floor?.trim()) fd.append('floor', payload.floor.trim())
  if (payload.apartment?.trim()) fd.append('apartment', payload.apartment.trim())
  fd.append('contactPhone', payload.contactPhone.trim())
  fd.append('saveAddress', String(payload.saveAddress === true))
  if (payload.savedAddressLabel?.trim()) {
    fd.append('savedAddressLabel', payload.savedAddressLabel.trim())
  }
  fd.append('discountAmount', String(payload.discountAmount ?? 0))
  fd.append('photo', photo, photo.name)
  return fd
}

export async function createOrderFromCartMultipart(
  api: ApiRequest,
  formData: FormData,
): Promise<{ orderId: string }> {
  const raw = await api(`/orders/checkout-multipart`, {
    method: 'POST',
    body: formData,
  })
  return unwrapBody<{ orderId: string }>(raw)
}
