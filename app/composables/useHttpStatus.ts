export function httpStatus(err: unknown): number | undefined {
  const e = err as {
    statusCode?: number
    status?: number
    response?: { status?: number }
  }
  return e.statusCode ?? e.status ?? e.response?.status
}
