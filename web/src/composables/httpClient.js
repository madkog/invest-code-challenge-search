export function buildUrl(path, params = {}) {
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
async function readErrorMessage(response) {
  const fallback = `HTTP ${response.status}`
  try {
    const body = await response.json()
    return body?.message || fallback
  } catch {
    return fallback // Body was not JSON.
  }
}

/**
 * Calls fetch and returns parsed JSON. Throws an Error with `.status` when the response is not OK.
 */
export async function request(url, { method = 'GET', body, signal } = {}) {
  const options = { method, signal }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    const error = new Error(await readErrorMessage(response))
    error.status = response.status
    throw error
  }
  return response.json()
}
