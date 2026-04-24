import type { NitroFetchRequest } from 'nitropack'
import { ApiClientError } from './apiClientError'
import { apiMessage } from './apiMessage'

/** Auth endpoints where 401 means invalid credentials or public failure — never refresh the session. */
const AUTH_PATHS_SKIP_401_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/refresh',
] as const

export function pathFromNitroRequest(request: NitroFetchRequest): string {
  if (typeof request === 'string') {
    const base = request.split('?')[0] ?? request
    return base.startsWith('/') ? base : `/${base}`
  }
  if (typeof Request !== 'undefined' && request instanceof Request) {
    try {
      const u = new URL(request.url)
      return u.pathname || '/'
    } catch {
      const s = request.url.split('?')[0] ?? '/'
      return s.startsWith('/') ? s : `/${s}`
    }
  }
  const r = request as { value?: unknown }
  if (r && typeof r === 'object' && 'value' in r && typeof r.value === 'string') {
    const v = r.value.split('?')[0] ?? '/'
    return v.startsWith('/') ? v : `/${v}`
  }
  return '/'
}

export function shouldSkip401SessionRefresh(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`
  return AUTH_PATHS_SKIP_401_REFRESH.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  )
}

export function getFetchErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  const o = err as Record<string, unknown>
  if (typeof o.statusCode === 'number') return o.statusCode
  const resp = o.response as { status?: number } | undefined
  if (resp && typeof resp.status === 'number') return resp.status
  return undefined
}

export function defaultHttpErrorMessage(status: number): string {
  if (status === 400) return 'Некорректный запрос.'
  if (status === 401) return 'Требуется вход в систему или неверные учётные данные.'
  if (status === 403) return 'Недостаточно прав для этого действия.'
  if (status === 404) return 'Ресурс не найден.'
  if (status === 408) return 'Превышено время ожидания ответа сервера.'
  if (status === 409) return 'Конфликт данных. Обновите страницу и попробуйте снова.'
  if (status === 422) return 'Не удалось обработать отправленные данные.'
  if (status === 429) return 'Слишком много запросов. Попробуйте позже.'
  if (status >= 500 && status < 600) return 'Ошибка сервера. Попробуйте позже.'
  return 'Не удалось выполнить запрос.'
}

export function normalizeApiError(err: unknown): ApiClientError {
  if (err instanceof ApiClientError) return err
  const statusCode = getFetchErrorStatus(err) ?? 0
  const data = (err as { data?: unknown }).data
  const fallback =
    statusCode > 0 ? defaultHttpErrorMessage(statusCode) : 'Не удалось выполнить запрос.'
  const message = apiMessage(err, fallback)
  return new ApiClientError(message, statusCode, data)
}
