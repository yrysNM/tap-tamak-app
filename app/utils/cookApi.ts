import type { Cook, PaginatedResponse } from '~/types'

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
  return unwrapCooksList(raw)
}
