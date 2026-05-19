/** Normalized cook menu for UI (GET today / GET by date / POST body echo). */
export interface CookMenuPayload {
  /** Server menu id when present; otherwise callers use date in path. */
  id?: string
  date: string
  dishIds: string[]
  /** Portions per menu when the API exposes it. */
  portionCount?: number
}

export type ApiRequest = (url: string, opts?: object) => Promise<unknown>

export interface UpdateMenuBody {
  date?: string
  dishIds?: string[]
  portionCount?: number
}

export function menuByIdPath(id: string): string {
  return `/menus/${encodeURIComponent(id)}`
}

export async function updateMenuById(
  api: ApiRequest,
  id: string,
  body: UpdateMenuBody,
): Promise<unknown> {
  return await api(menuByIdPath(id), { method: 'PATCH', body })
}

export async function deleteMenuById(api: ApiRequest, id: string): Promise<unknown> {
  return await api(menuByIdPath(id), { method: 'DELETE' })
}

function normalizeMenuDate(value: string): string {
  const direct = /^(\d{4}-\d{2}-\d{2})/.exec(value)
  if (direct?.[1]) return direct[1]
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object') return null
  return v as Record<string, unknown>
}

function dishIdsFromDishes(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const ids: string[] = []
  for (const item of v) {
    const o = asRecord(item)
    if (o && typeof o.id === 'string') ids.push(o.id)
  }
  return ids
}

/** Accepts several backend envelope shapes. */
export function unwrapMenuPayload(raw: unknown): CookMenuPayload | null {
  const root = asRecord(raw)
  if (!root) return null

  let node: Record<string, unknown> | null = root
  const data = root.data
  if (data && typeof data === 'object') {
    node = data as Record<string, unknown>
  }

  if (!node) return null

  const date =
    typeof node.date === 'string'
      ? node.date
      : typeof node.menuDate === 'string'
        ? node.menuDate
        : null
  if (!date) return null

  let dishIds: string[] = []
  if (Array.isArray(node.dishIds)) {
    dishIds = node.dishIds.filter((x): x is string => typeof x === 'string')
  } else if (Array.isArray(node.dishes)) {
    dishIds = dishIdsFromDishes(node.dishes)
  }

  const id =
    typeof node.id === 'string'
      ? node.id
      : typeof node._id === 'string'
        ? node._id
        : typeof node.menuId === 'string'
          ? node.menuId
          : undefined

  const portionRaw = node.portionCount
  let portionCount: number | undefined
  if (typeof portionRaw === 'number' && Number.isFinite(portionRaw) && portionRaw >= 1) {
    portionCount = Math.trunc(portionRaw)
  }

  return {
    date: normalizeMenuDate(date),
    dishIds,
    ...(id ? { id } : {}),
    ...(portionCount != null ? { portionCount } : {}),
  }
}

/** Pagination from GET /menus/history. */
export interface MenusHistoryMeta {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

function metaFromNode(node: Record<string, unknown> | null): MenusHistoryMeta | null {
  if (!node) return null
  const m = node.meta
  if (!m || typeof m !== 'object') return null
  const o = m as Record<string, unknown>
  const num = (k: string) => (typeof o[k] === 'number' ? (o[k] as number) : undefined)
  return {
    total: num('total'),
    page: num('page'),
    limit: num('limit'),
    totalPages: num('totalPages'),
  }
}

/** Cook menu row from GET /menus/history (best-effort field mapping). */
export interface CookMenuHistoryItem {
  /** When API omits id, UI uses `date` for GET/PATCH/DELETE paths. */
  id?: string
  date: string
  dishCount: number
  dishNamePreview: string[]
  createdAt?: string
  status: string
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function dishNamesFromMenu(o: Record<string, unknown>, max = 4): string[] {
  const dishes = o.dishes
  if (!Array.isArray(dishes)) return []
  const names: string[] = []
  for (const d of dishes) {
    const row = asRecord(d)
    const n = row && typeof row.name === 'string' ? row.name : undefined
    if (n) names.push(n)
    if (names.length >= max) break
  }
  return names
}

function itemFromRecord(o: Record<string, unknown>): CookMenuHistoryItem | null {
  const date =
    str(o.date)
    ?? str(o.menuDate)
    ?? (typeof o.menu === 'object' && o.menu !== null
      ? str(asRecord(o.menu)?.date ?? asRecord(o.menu)?.menuDate)
      : undefined)
  if (!date) return null

  let dishCount = num(o.dishCount) ?? num(o.dishesCount)
  const dishes = o.dishes
  if (dishCount == null && Array.isArray(dishes)) dishCount = dishes.length

  const idLen = dishIdsLen(o)
  if (dishCount == null && idLen != null) dishCount = idLen

  const dishNamePreview = dishNamesFromMenu(o)
  const createdAt =
    str(o.createdAt)
    ?? str(o.created_at)
    ?? str(o.createdAtUtc)
    ?? str(asRecord(o.meta)?.createdAt as string | undefined)

  const statusRaw = str(o.status) ?? str(o.state) ?? str(o.menuStatus)
  const status = statusRaw?.trim() || 'Created'

  const id =
    str(o.id)
    ?? str(o._id)
    ?? str(o.menuId)
    ?? (typeof o.menu === 'object' && o.menu !== null
      ? str(asRecord(o.menu)?.id ?? asRecord(o.menu)?.menuId)
      : undefined)

  return {
    date: normalizeMenuDate(date),
    dishCount: dishCount ?? dishNamePreview.length,
    dishNamePreview,
    createdAt,
    status,
    ...(id ? { id } : {}),
  }
}

function dishIdsLen(o: Record<string, unknown>): number | undefined {
  const ids = o.dishIds
  if (Array.isArray(ids)) return ids.filter((x): x is string => typeof x === 'string').length
  return undefined
}

function historyArray(raw: unknown): unknown[] | null {
  const root = asRecord(raw)
  let arr: unknown[] | null = null

  if (Array.isArray(raw)) {
    arr = raw
  } else if (root) {
    const data = root.data
    if (Array.isArray(data)) {
      arr = data
    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
      const inner = data as Record<string, unknown>
      if (Array.isArray(inner.data)) arr = inner.data
      if (!arr && Array.isArray(inner.items)) arr = inner.items
      if (!arr && Array.isArray(inner.menus)) arr = inner.menus
    }
    if (!arr && Array.isArray(root.items)) arr = root.items
    if (!arr && Array.isArray(root.menus)) arr = root.menus
  }

  return arr
}

/** History list: array of menus or dates (supports paginated envelopes). */
export function unwrapMenusHistory(raw: unknown): { date: string }[] {
  const arr = historyArray(raw)
  if (!arr) return []

  const out: { date: string }[] = []
  for (const item of arr) {
    const o = asRecord(item)
    if (!o) continue
    const full = itemFromRecord(o)
    if (full) {
      out.push({ date: full.date })
      continue
    }
    const d =
      typeof o.date === 'string'
        ? o.date
        : typeof o.menuDate === 'string'
          ? o.menuDate
          : null
    if (d) out.push({ date: normalizeMenuDate(d) })
  }
  return out
}

/** Full rows for menu history cards. */
export function unwrapMenusHistoryItems(raw: unknown): CookMenuHistoryItem[] {
  const arr = historyArray(raw)
  if (!arr) return []
  const out: CookMenuHistoryItem[] = []
  for (const item of arr) {
    const o = asRecord(item)
    if (!o) continue
    const row = itemFromRecord(o)
    if (row) {
      out.push(row)
      continue
    }
    const d =
      typeof o.date === 'string'
        ? o.date
        : typeof o.menuDate === 'string'
          ? o.menuDate
          : null
    if (d) {
      const fallbackId = str(o.id) ?? str(o._id) ?? str(o.menuId)
      out.push({
        date: normalizeMenuDate(d),
        dishCount: 0,
        dishNamePreview: [],
        status: 'Created',
        ...(fallbackId ? { id: fallbackId } : {}),
      })
    }
  }
  return out
}

export function unwrapMenusHistoryMeta(raw: unknown): MenusHistoryMeta | null {
  const root = asRecord(raw)
  if (!root) return null
  let m = metaFromNode(root)
  if (m) return m
  const data = root.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    m = metaFromNode(data as Record<string, unknown>)
  }
  return m ?? null
}
