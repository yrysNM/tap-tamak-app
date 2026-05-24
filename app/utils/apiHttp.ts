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

const HTTP_ERROR_KEYS: Record<number, string> = {
  400: 'l_Bad_request',
  401: 'l_Unauthorized',
  403: 'l_Forbidden',
  404: 'l_Not_found',
  408: 'l_Timeout',
  409: 'l_Conflict',
  422: 'l_Unprocessable',
  429: 'l_Too_many_requests',
}

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
  const key = HTTP_ERROR_KEYS[status]
  if (key) return appT(key)
  if (status >= 500 && status < 600) return appT('l_Server_error')
  return appT('l_Request_failed')
}

export function normalizeApiError(err: unknown): ApiClientError {
  if (err instanceof ApiClientError) return err
  const statusCode = getFetchErrorStatus(err) ?? 0
  const data = (err as { data?: unknown }).data
  const fallback =
    statusCode > 0 ? defaultHttpErrorMessage(statusCode) : appT('l_Request_failed')
  const message = apiMessage(err, 'l_Request_failed')
  return new ApiClientError(message, statusCode, data)
}
