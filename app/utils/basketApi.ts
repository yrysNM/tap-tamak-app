import type {
  BasketCookGroup,
  BasketCookSummary,
  BasketGetResponse,
  BasketLineItem,
} from '~/types'

type ApiRequest = (url: string, opts?: object) => Promise<unknown>

export async function fetchBasket(api: ApiRequest): Promise<BasketGetResponse> {
  const raw = await api(`/basket`, { method: 'GET' })
  const body = (raw as { data?: unknown })?.data ?? raw
  return normalizeBasket(body)
}

export async function removeBasketItem(
  api: ApiRequest,
  cartItemId: string,
): Promise<void> {
  await api(`/basket/items/${encodeURIComponent(cartItemId)}`, {
    method: 'DELETE',
  })
}

export async function updateBasketItemQuantity(
  api: ApiRequest,
  cartItemId: string,
  quantity: number,
): Promise<void> {
  if (quantity < 1) {
    await removeBasketItem(api, cartItemId)
    return
  }
  await api(`/basket/items/${encodeURIComponent(cartItemId)}`, {
    method: 'PATCH',
    body: { quantity },
  })
}

function normalizeBasket(raw: unknown): BasketGetResponse {
  const empty: BasketGetResponse = {
    cookId: null,
    cook: null,
    groups: [],
    items: [],
    itemsCount: 0,
    itemsTotal: 0,
  }
  if (!raw || typeof raw !== 'object') return empty

  const o = raw as Record<string, unknown>
  const cookRaw = o.cook
  const cook = parseCookSummary(cookRaw)
  const cookId =
    typeof o.cookId === 'string'
      ? o.cookId
      : cook?.id ?? null

  const itemsRaw = Array.isArray(o.items) ? o.items : []
  const items: BasketLineItem[] = itemsRaw
    .map((row) => parseLineItem(row))
    .filter((x): x is BasketLineItem => x != null)

  const groupsRaw = Array.isArray(o.groups) ? o.groups : []
  const groups: BasketCookGroup[] = groupsRaw
    .map((row) => parseCookGroup(row))
    .filter((x): x is BasketCookGroup => x != null)

  const resolvedGroups =
    groups.length > 0
      ? groups
      : cook && cookId
        ? [
            {
              cookId,
              cook,
              items,
              itemsCount: items.reduce((s, i) => s + i.quantity, 0),
              itemsTotal: items.reduce((s, i) => s + i.lineSubtotal, 0),
            },
          ]
        : []

  const itemsCount =
    typeof o.itemsCount === 'number' && Number.isFinite(o.itemsCount)
      ? Math.max(0, Math.trunc(o.itemsCount))
      : items.reduce((s, i) => s + i.quantity, 0)

  const itemsTotal =
    typeof o.itemsTotal === 'number' && Number.isFinite(o.itemsTotal)
      ? o.itemsTotal
      : items.reduce((s, i) => s + i.lineSubtotal, 0)

  return {
    cookId,
    cook,
    groups: resolvedGroups,
    items,
    itemsCount,
    itemsTotal,
  }
}

function parseCookGroup(raw: unknown): BasketCookGroup | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const cook = parseCookSummary(row.cook)
  const cookId =
    typeof row.cookId === 'string' ? row.cookId : cook?.id ?? null
  if (!cook || !cookId) return null

  const itemsRaw = Array.isArray(row.items) ? row.items : []
  const items = itemsRaw
    .map((item) => parseLineItem(item))
    .filter((x): x is BasketLineItem => x != null)

  const itemsCount =
    typeof row.itemsCount === 'number' && Number.isFinite(row.itemsCount)
      ? Math.max(0, Math.trunc(row.itemsCount))
      : items.reduce((s, i) => s + i.quantity, 0)

  const itemsTotal =
    typeof row.itemsTotal === 'number' && Number.isFinite(row.itemsTotal)
      ? row.itemsTotal
      : items.reduce((s, i) => s + i.lineSubtotal, 0)

  return { cookId, cook, items, itemsCount, itemsTotal }
}

function parseCookSummary(raw: unknown): BasketCookSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Record<string, unknown>
  if (typeof c.id !== 'string' || typeof c.businessName !== 'string') return null

  const rating = typeof c.rating === 'number' && Number.isFinite(c.rating) ? c.rating : 0
  const totalReviews =
    typeof c.totalReviews === 'number' && Number.isFinite(c.totalReviews)
      ? Math.max(0, Math.trunc(c.totalReviews))
      : 0

  const kitchenPhotoUrls = Array.isArray(c.kitchenPhotoUrls)
    ? (c.kitchenPhotoUrls.filter((u) => typeof u === 'string') as string[])
    : []

  const isAvailable = typeof c.isAvailable === 'boolean' ? c.isAvailable : true

  return {
    id: c.id,
    businessName: c.businessName,
    profileImageUrl: typeof c.chefAvatarUrl === 'string' ? c.chefAvatarUrl : undefined,
    bio: c.bio === null || typeof c.bio === 'string' ? (c.bio as string | null | undefined) : undefined,
    rating,
    totalReviews,
    latitude: typeof c.latitude === 'number' ? c.latitude : undefined,
    longitude: typeof c.longitude === 'number' ? c.longitude : undefined,
    isAvailable,
    kitchenPhotoUrls,
  }
}

function parseLineItem(raw: unknown): BasketLineItem | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.dishId !== 'string') return null
  const quantity =
    typeof row.quantity === 'number' && Number.isFinite(row.quantity)
      ? Math.max(0, Math.trunc(row.quantity))
      : 0
  if (quantity <= 0) return null

  const lineSubtotal =
    typeof row.lineSubtotal === 'number' && Number.isFinite(row.lineSubtotal)
      ? row.lineSubtotal
      : 0

  const dishRaw = row.dish
  if (!dishRaw || typeof dishRaw !== 'object') return null
  const d = dishRaw as Record<string, unknown>
  if (typeof d.id !== 'string' || typeof d.name !== 'string') return null
  const price = typeof d.price === 'number' && Number.isFinite(d.price) ? d.price : 0
  const cookId = typeof d.cookId === 'string' ? d.cookId : ''
  const isAvailable = typeof d.isAvailable === 'boolean' ? d.isAvailable : true

  return {
    id: row.id,
    dishId: row.dishId,
    quantity,
    lineSubtotal,
    dish: {
      id: d.id,
      name: d.name,
      description: d.description == null ? undefined : String(d.description),
      price,
      imageUrl: d.imageUrl == null ? undefined : String(d.imageUrl),
      isAvailable,
      portionCount: (() => {
        if (d.portionCount == null || d.portionCount === '') return undefined
        const n = Number(d.portionCount)
        return Number.isFinite(n) ? n : undefined
      })(),
      cookId,
    },
  }
}
