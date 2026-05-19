/** UTC calendar day YYYY-MM-DD (matches backend menu dates). */
export function utcTodayYmd(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function utcYmdAddDays(ymd: string, deltaDays: number): string {
  const parts = ymd.split('-').map((x) => Number.parseInt(x, 10))
  const y = parts[0]
  const mo = parts[1]
  const day = parts[2]
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(day)) {
    return ymd
  }
  const dt = new Date(Date.UTC(y || 1970, (mo || 0) - 1, day))
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Full UTC calendar month immediately before `ref` (excludes `ref`'s month, so never includes “today” when `ref` is now). */
export function utcMonthRangeYmd(ref = new Date()): { from: string; to: string } {
  const y = ref.getUTCFullYear()
  const m0 = ref.getUTCMonth()
  const prev = new Date(Date.UTC(y, m0 - 1, 1))
  const py = prev.getUTCFullYear()
  const pm0 = prev.getUTCMonth()
  const from = `${py}-${String(pm0 + 1).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(py, pm0 + 1, 0)).getUTCDate()
  const to = `${py}-${String(pm0 + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { from, to }
}

/** Display label (ru-RU, UTC calendar day). */
export function formatMenuDateLabel(ymd: string): string {
  const [ys, ms, ds] = ymd.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ymd
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function ymdFromLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
