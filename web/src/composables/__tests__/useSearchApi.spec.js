import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { useSearchApi } from '../useSearchApi'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('useSearchApi', () => {
  let fetchMock
  let api

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [], count: 0 }))
    vi.stubGlobal('fetch', fetchMock)
    api = useSearchApi()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function lastCall() {
    const [url, options] = fetchMock.mock.calls[0]
    return { url, options }
  }

  describe('search', () => {
    it('POSTs the query as JSON to /api/search', async () => {
      const query = {
        search_text: 'a200',
        kind: ['etf'],
        order_by: 'symbol.asc',
        from: 1,
        size: 10,
      }

      await api.search(query)

      const { url, options } = lastCall()
      expect(url).toBe('/api/search')
      expect(options.method).toBe('POST')
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(JSON.parse(options.body)).toEqual(query)
    })

    it('sends an empty object when there is no query', async () => {
      await api.search()

      expect(lastCall().options.body).toBe('{}')
    })

    it('adds a comma separated fields param', async () => {
      await api.search({}, { fields: ['symbol', 'kind'] })

      expect(lastCall().url).toBe('/api/search?fields=symbol%2Ckind')
    })

    it('returns the parsed response', async () => {
      const body = { results: [{ symbol: 'A200' }], count: 1, indexed_at: 1 }
      fetchMock.mockResolvedValue(jsonResponse(body))

      expect(await api.search({ search_text: 'a200' })).toEqual(body)
    })

    it('can be aborted with the signal', async () => {
      fetchMock.mockImplementation(
        (_url, { signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            })
          }),
      )
      const controller = new AbortController()

      const promise = api.search({ search_text: 'a' }, { signal: controller.signal })
      controller.abort()

      await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    })
  })

  describe('getSuggestions', () => {
    it('searches with light fields and the given text and size', async () => {
      await api.getSuggestions('vas', { size: 5 })

      const { url, options } = lastCall()
      expect(url).toBe('/api/search?fields=symbol%2Cdisplay_name')
      expect(JSON.parse(options.body)).toEqual({ search_text: 'vas', size: 5 })
    })

    it('defaults the size to 6', async () => {
      await api.getSuggestions('vas')

      expect(JSON.parse(lastCall().options.body)).toEqual({ search_text: 'vas', size: 6 })
    })
  })

  describe('getFacetCounts', () => {
    it('POSTs the query to /api/facets/:key', async () => {
      const query = { search_text: 'bonds' }

      await api.getFacetCounts('kind', query)

      const { url, options } = lastCall()
      expect(url).toBe('/api/facets/kind')
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual(query)
    })

    it('adds omit_empty_counts when asked', async () => {
      await api.getFacetCounts('issuer', {}, { omitEmptyCounts: true })

      expect(lastCall().url).toBe('/api/facets/issuer?omit_empty_counts=true')
    })

    it('encodes the key', async () => {
      await api.getFacetCounts('a/b')

      expect(lastCall().url).toBe('/api/facets/a%2Fb')
    })
  })

  describe('getFacetKeys', () => {
    it('GETs /api/facets/keys without a body', async () => {
      await api.getFacetKeys()

      const { url, options } = lastCall()
      expect(url).toBe('/api/facets/keys')
      expect(options.method).toBe('GET')
      expect(options.body).toBeUndefined()
    })
  })

  describe('getInstrument', () => {
    it('GETs the encoded instrument id', async () => {
      await api.getInstrument('A200:AU')

      const { url, options } = lastCall()
      expect(url).toBe('/api/instruments/A200%3AAU')
      expect(options.method).toBe('GET')
    })

    it('adds the fields param', async () => {
      await api.getInstrument('A200:AU', { fields: ['symbol'] })

      expect(lastCall().url).toBe('/api/instruments/A200%3AAU?fields=symbol')
    })
  })

  describe('errors', () => {
    it('throws the API message and status for a non-OK response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Bad query' }, 400))

      await expect(api.search({ from: -1 })).rejects.toMatchObject({
        message: 'Bad query',
        status: 400,
      })
    })

    it('falls back to the HTTP status when the error body is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('oops', { status: 500 }))

      await expect(api.search()).rejects.toMatchObject({ message: 'HTTP 500', status: 500 })
    })

    it('rejects with the network error when fetch fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(api.getFacetKeys()).rejects.toThrow('Failed to fetch')
    })
  })
})
