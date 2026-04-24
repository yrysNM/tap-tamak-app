export class ApiClientError extends Error {
  readonly statusCode: number
  readonly data: unknown

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
    this.data = data
  }
}
