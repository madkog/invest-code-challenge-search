type QueryParams = Record<string, string | number | boolean | null | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

/**
 * Thrown for a non-OK response. `message` is the API's message, or "HTTP <status>".
 */
export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
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

/**
 * Calls fetch and returns parsed JSON. Throws an HttpError when the response is not OK.
 */
export async function request<T>(
  url: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  const options: RequestInit = { method, signal }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    throw new HttpError(await readErrorMessage(response), response.status)
  }
  return response.json()
}
