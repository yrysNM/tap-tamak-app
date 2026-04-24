import { ApiClientError } from './apiClientError'

export function apiMessage(
  err: unknown,
  fallback = 'Не удалось выполнить запрос.',
): string {
  if (err instanceof ApiClientError) return err.message
  const e = err as {
    data?: { message?: string | string[] }
    message?: string
  }
  const m = e?.data?.message
  if (Array.isArray(m)) return m.join(', ')
  if (typeof m === 'string') return m
  if (e?.message) return e.message
  return fallback
}
