import type { CookDish, PaginatedResponse } from '~/types'

export type DishesListMeta = PaginatedResponse<CookDish>['meta']

type ApiRequest = (url: string, opts?: object) => Promise<unknown>

export type UpdateDishBody = Partial<
  Pick<
    CookDish,
    | 'name'
    | 'description'
    | 'price'
    | 'cookingTime'
    | 'preparationType'
    | 'isAvailable'
    | 'calories'
    | 'portionCount'
  >
>

export function dishByIdPath(id: string): string {
  return `/dishes/${encodeURIComponent(id)}`
}

export async function fetchDishesPage(
  api: ApiRequest,
  page = 1,
  limit = 20,
): Promise<{ items: CookDish[]; meta: DishesListMeta | null }> {
  const raw = await api(`/dishes?page=${page}&limit=${limit}`)
  return unwrapDishesList(raw)
}

export async function updateDishById(
  api: ApiRequest,
  id: string,
  body: UpdateDishBody | FormData,
): Promise<unknown> {
  return await api(dishByIdPath(id), { method: 'PATCH', body })
}

export async function deleteDishById(api: ApiRequest, id: string): Promise<unknown> {
  return await api(dishByIdPath(id), { method: 'DELETE' })
}

export function unwrapDishesList(raw: unknown): {
  items: CookDish[]
  meta: DishesListMeta | null
} {
  if (Array.isArray(raw)) {
    return { items: raw as CookDish[], meta: null }
  }
  if (!raw || typeof raw !== 'object') {
    return { items: [], meta: null }
  }
  const o = raw as Record<string, unknown>

  if (Array.isArray(o.data)) {
    const meta = o.meta as DishesListMeta | undefined
    return { items: o.data as CookDish[], meta: meta ?? null }
  }

  if (Array.isArray(o.items)) {
    const meta = o.meta as DishesListMeta | undefined
    return { items: o.items as CookDish[], meta: meta ?? null }
  }

  const nested = o.data
  if (nested && typeof nested === 'object') {
    const inner = nested as Record<string, unknown>
    if (Array.isArray(inner.data)) {
      const meta = inner.meta as DishesListMeta | undefined
      return { items: inner.data as CookDish[], meta: meta ?? null }
    }
  }

  return { items: [], meta: null }
}

export function unwrapDishPayload(raw: unknown): CookDish | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if ('data' in o && o.data && typeof o.data === 'object') {
    const d = o.data as Record<string, unknown>
    if (typeof d.id === 'string' && typeof d.name === 'string') {
      return o.data as CookDish
    }
  }
  if (typeof o.id === 'string' && typeof o.name === 'string') {
    return raw as CookDish
  }
  return null
}

export function dishImageSrc(
  imageUrl: string | undefined,
  apiBaseUrl: string,
): string | undefined {
  if (!imageUrl) return undefined
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl

  const origin = apiBaseUrl.replace(/\/api\/v1\/?$/i, '')
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`

  if (/api\/v1\/uploads/i.test(imageUrl)) {
    return `${origin}${normalizedPath}`
  }

  const uploadPath = imageUrl.replace(/^\/+/, '')
  const base = apiBaseUrl.replace(/\/+$/, '')
  return `${base}/uploads/${uploadPath}`
}
