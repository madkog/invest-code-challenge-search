import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

import { buildUrl, request } from '../httpClient'

describe('buildUrl', () => {
  it('returns the path when there are no params', () => {
    expect(buildUrl('/search')).toBe('/search')
  })

  it('adds and encodes params', () => {
    expect(buildUrl('/search', { fields: 'a,b', page: 2 })).toBe('/search?fields=a%2Cb&page=2')
  })

  it('leaves out undefined, null and empty params', () => {
    expect(buildUrl('/search', { a: undefined, b: null, c: '' })).toBe('/search')
  })
})

// Like the real fetch: rejects with an AbortError when the signal aborts.
function fetchThatHonoursSignal(_url: unknown, options?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    })
  })
}

describe('request', () => {
  let fetchMock: Mock<typeof fetch>

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ok: true })))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function lastCall() {
    const call = fetchMock.mock.calls[0]
    if (!call) throw new Error('fetch was not called')
    const [url, options = {}] = call
    return { url, options }
  }

  it('GETs without a body or headers by default', async () => {
    expect(await request('/x')).toEqual({ ok: true })

    const { url, options } = lastCall()
    expect(url).toBe('/x')
    expect(options.method).toBe('GET')
    expect(options.body).toBeUndefined()
    expect(options.headers).toBeUndefined()
  })

  it('sends a JSON body with a content type', async () => {
    await request('/x', { method: 'POST', body: { a: 1 } })

    const { options } = lastCall()
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(options.body).toBe('{"a":1}')
  })

  it('rejects with an AbortError when the signal is aborted', async () => {
    fetchMock.mockImplementation(fetchThatHonoursSignal)
    const controller = new AbortController()

    const promise = request('/x', { signal: controller.signal })
    controller.abort()

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('throws the API message and status for a non-OK response', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Bad' }), { status: 400 }))

    await expect(request('/x')).rejects.toMatchObject({ message: 'Bad', status: 400 })
  })

  it('falls back to the HTTP status when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }))

    await expect(request('/x')).rejects.toMatchObject({ message: 'HTTP 500', status: 500 })
  })
})
