export type QueryParams = Record<string, string | number | boolean | null | undefined>

// A request that takes longer than this fails, so a hung server does not leave the page loading.
const DEFAULT_TIMEOUT_MS = 10_000

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * Thrown for a non-OK response. `message` is the API's message, or "HTTP <status>".
 * `url` is the request that failed, so it shows up in the logs.
 */
export class HttpError extends Error {
  status: number
  url: string

  constructor(message: string, status: number, url: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

// Empty params are left out of the query string.
export function buildUrl(path: string, params: QueryParams = {}): string {
  const searchParams = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(name, String(value))
    }
  }
  const queryString = searchParams.toString()
  return `${path}${queryString ? `?${queryString}` : ''}`
}

/**
 * Reads the API's `{ message }` error body, falling back to the HTTP status.
 */
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `HTTP ${response.status}`
  try {
    const body = await response.json()
    return body?.message || fallback
  } catch {
    return fallback // Body was not JSON.
  }
}

// Stops the request when the caller cancels it or when it takes too long.
function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

/**
 * Calls fetch and returns parsed JSON. Throws an HttpError when the response is not OK, and a
 * TimeoutError when it takes longer than `timeoutMs`.
 */
export async function request<T>(
  url: string,
  { method = 'GET', body, signal, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  const options: RequestInit = { method, signal: withTimeout(signal, timeoutMs) }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    throw new HttpError(await readErrorMessage(response), response.status, url)
  }
  return response.json()
}
