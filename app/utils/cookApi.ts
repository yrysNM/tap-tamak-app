import type { Cook, PaginatedResponse, PublicCookMenuPayload } from '~/types'

export type CooksListMeta = PaginatedResponse<Cook>['meta']

type ApiRequest = (url: string, opts?: object) => Promise<unknown>

export function unwrapCooksList(raw: unknown): {
  items: Cook[]
  meta: CooksListMeta | null
} {
  if (Array.isArray(raw)) {
    return { items: raw as Cook[], meta: null }
  }
  if (!raw || typeof raw !== 'object') {
    return { items: [], meta: null }
  }
  const o = raw as Record<string, unknown>

  if (Array.isArray(o.data)) {
    const meta = o.meta as CooksListMeta | undefined
    return { items: o.data as Cook[], meta: meta ?? null }
  }

  if (Array.isArray(o.items)) {
    const meta = o.meta as CooksListMeta | undefined
    return { items: o.items as Cook[], meta: meta ?? null }
  }

  const nested = o.data
  if (nested && typeof nested === 'object') {
    const inner = nested as Record<string, unknown>
    if (Array.isArray(inner.data)) {
      const meta = inner.meta as CooksListMeta | undefined
      return { items: inner.data as Cook[], meta: meta ?? null }
    }
  }

  return { items: [], meta: null }
}

export async function fetchCooksPage(
  api: ApiRequest,
  page = 1,
  limit = 20,
): Promise<{ items: Cook[]; meta: CooksListMeta | null }> {
  const raw = await api(`/cooks?page=${page}&limit=${limit}`)
  const body = (raw as { data?: unknown })?.data ?? raw
  return unwrapCooksList((body as any)?.items)
}

export async function fetchPublicCookMenuInformation(
  api: ApiRequest,
  cookId: string,
  dateYmd: string,
): Promise<PublicCookMenuPayload> {
  const encodedCookId = encodeURIComponent(cookId)
  const encodedDate = encodeURIComponent(dateYmd)
  const raw = await api(`/cooks/${encodedCookId}/menus-information?date=${encodedDate}`, {
    method: 'GET',
  })
  const payload = unwrapPublicCookMenuInformation((raw as { data?: unknown })?.data ?? raw)
  return payload ?? { cook: fallbackCook(cookId), menu: null, dishes: [] }
}

function unwrapPublicCookMenuInformation(raw: unknown): PublicCookMenuPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const inner = (o.data && typeof o.data === 'object' ? o.data : o) as Record<string, unknown>

  const cookRaw = (inner.cook && typeof inner.cook === 'object' ? inner.cook : null) as
    | Record<string, unknown>
    | null
  if (!cookRaw || typeof cookRaw.id !== 'string') return null

  const menuRaw = (inner.menu && typeof inner.menu === 'object' ? inner.menu : null) as
    | Record<string, unknown>
    | null
  const dishesRaw = Array.isArray(inner.dishes) ? inner.dishes : []

  return {
    cook: {
      id: cookRaw.id,
      businessName: typeof cookRaw.businessName === 'string' ? cookRaw.businessName : 'Повар',
      bio: typeof cookRaw.bio === 'string' || cookRaw.bio === null ? (cookRaw.bio as string | null) : null,
      rating: toNumber(cookRaw.rating),
      totalReviews: Math.max(0, Math.trunc(toNumber(cookRaw.totalReviews))),
      latitude: toOptionalNumber(cookRaw.latitude),
      longitude: toOptionalNumber(cookRaw.longitude),
      isAvailable: cookRaw.isAvailable !== false,
      kitchenPhotoUrls: Array.isArray(cookRaw.kitchenPhotoUrls)
        ? cookRaw.kitchenPhotoUrls.filter((x): x is string => typeof x === 'string')
        : [],
    },
    menu: menuRaw && typeof menuRaw.id === 'string'
      ? {
          id: menuRaw.id,
          date: typeof menuRaw.date === 'string' ? menuRaw.date : '',
        }
      : null,
    dishes: dishesRaw.filter((x): x is PublicCookMenuPayload['dishes'][number] => {
      return !!x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string'
    }) as PublicCookMenuPayload['dishes'],
  }
}

function fallbackCook(cookId: string) {
  return {
    id: cookId,
    businessName: 'Повар',
    bio: null,
    rating: 0,
    totalReviews: 0,
    isAvailable: false,
    kitchenPhotoUrls: [],
  }
}

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function toOptionalNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}
