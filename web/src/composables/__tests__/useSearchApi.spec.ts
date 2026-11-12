import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

import type { Filters, Instrument } from '../../types/search'
import { useSearchApi } from '../useSearchApi'

const noFilters: Filters = {
  kind: [],
  issuer: [],
  isBetashares: null,
  isFlagshipFund: null,
  isAutoInvestIncluded: null,
}

// An instrument as the API sends it, and the same instrument in the app's format.
const API_A200 = {
  symbol: 'A200',
  symbol_openfigi: 'A200:AU',
  display_name: 'Betashares Australia 200 ETF',
  kind: 'etf',
  currency: 'AUD',
  logo: 'a200.svg',
  issuer: 'betashares',
  is_betashares: true,
  is_flagship_fund: true,
  is_portfolio_excluded: false,
  is_auto_invest_included: true,
  units_circulating: '1500000000',
}

const APP_A200: Instrument = {
  id: 'A200:AU',
  symbol: 'A200',
  name: 'Betashares Australia 200 ETF',
  kind: 'etf',
  currency: 'AUD',
  logoUrl: 'a200.svg',
  issuer: 'betashares',
  isBetashares: true,
  isFlagshipFund: true,
  isPortfolioExcluded: false,
  isAutoInvestIncluded: true,
  unitsCirculating: 1500000000,
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('useSearchApi', () => {
  let fetchMock: Mock<typeof fetch>
  let api: ReturnType<typeof useSearchApi>

  beforeEach(() => {
    fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ results: [], count: 0, indexed_at: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    api = useSearchApi()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function lastCall() {
    const call = fetchMock.mock.calls[0]
    if (!call) throw new Error('fetch was not called')
    const [url, options = {}] = call
    return { url: String(url), options }
  }

  function sentBody() {
    return JSON.parse(String(lastCall().options.body))
  }

  describe('search request', () => {
    it('POSTs the params as an API request body to /api/search', async () => {
      await api.search({
        text: 'a200',
        filters: { ...noFilters, kind: ['etf'] },
        sort: { field: 'symbol', direction: 'asc' },
        page: 1,
        size: 10,
      })

      const { url, options } = lastCall()
      expect(url).toBe('/api/search')
      expect(options.method).toBe('POST')
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(sentBody()).toEqual({
        search_text: 'a200',
        kind: ['etf'],
        order_by: 'symbol.asc',
        from: 1,
        size: 10,
      })
    })

    it('sends multi-select filters as lists', async () => {
      await api.search({
        filters: { ...noFilters, kind: ['etf'], issuer: ['betashares', 'vaneck'] },
      })

      expect(sentBody()).toEqual({ kind: ['etf'], issuer: ['betashares', 'vaneck'] })
    })

    it('sends booleans as { value } with the API names, and keeps false', async () => {
      await api.search({ filters: { ...noFilters, isBetashares: true, isFlagshipFund: false } })

      expect(sentBody()).toEqual({
        is_betashares: { value: true },
        is_flagship_fund: { value: false },
      })
    })

    it('sends kinds with the API names, so a share is "equity"', async () => {
      await api.search({ filters: { kind: ['etf', 'share'] } })

      expect(sentBody()).toEqual({ kind: ['etf', 'equity'] })
    })

    it('sends the Auto Invest filter with its API name', async () => {
      await api.search({ filters: { isAutoInvestIncluded: true } })

      expect(sentBody()).toEqual({ is_auto_invest_included: { value: true } })
    })

    it('accepts some of the filters only', async () => {
      await api.search({ filters: { issuer: ['vanguard'] } })

      expect(sentBody()).toEqual({ issuer: ['vanguard'] })
    })

    it('sends the shares on issue sort with the API field name', async () => {
      await api.search({ sort: { field: 'unitsCirculating', direction: 'desc' } })

      expect(sentBody()).toEqual({ order_by: 'units_circulating.desc' })
    })

    it('sends the name sort with the API field name', async () => {
      await api.search({ sort: { field: 'name', direction: 'desc' } })

      expect(sentBody()).toEqual({ order_by: 'display_name.desc' })
    })

    it('leaves out blank text, no sort, empty lists and unset booleans', async () => {
      await api.search({ text: '', filters: noFilters, sort: null, page: 2 })

      expect(sentBody()).toEqual({ from: 2 })
    })

    it('sends an empty object when there are no params', async () => {
      await api.search()

      expect(lastCall().options.body).toBe('{}')
    })

    it('can be aborted with the signal', async () => {
      fetchMock.mockImplementation(
        (_url, options) =>
          new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            })
          }),
      )
      const controller = new AbortController()

      const promise = api.search({ text: 'a' }, { signal: controller.signal })
      controller.abort()

      await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    })
  })

  describe('search response', () => {
    it('returns the results in the app format, with the count', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ results: [API_A200], count: 42, indexed_at: 1794444566255 }),
      )

      expect(await api.search()).toEqual({ results: [APP_A200], count: 42 })
    })

    it('turns the API kind "equity" into the app kind "share", and anything else into "etf"', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          results: [
            { ...API_A200, kind: 'equity' },
            { ...API_A200, kind: 'etf' },
          ],
          count: 2,
          indexed_at: 1,
        }),
      )

      const { results } = await api.search()

      expect(results.map((result) => result.kind)).toEqual(['share', 'etf'])
    })

    it('turns a missing units value into null', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          results: [{ ...API_A200, units_circulating: null }],
          count: 1,
          indexed_at: 1,
        }),
      )

      const { results } = await api.search()

      expect(results[0]?.unitsCirculating).toBeNull()
    })
  })

  describe('getSuggestions', () => {
    it('searches with light fields and the given text and size', async () => {
      await api.getSuggestions('vas', { size: 5 })

      expect(lastCall().url).toBe(
        '/api/search?fields=symbol%2Csymbol_openfigi%2Cdisplay_name%2Ckind%2Cissuer',
      )
      expect(sentBody()).toEqual({ search_text: 'vas', size: 5 })
    })

    it('defaults the size to 6', async () => {
      await api.getSuggestions('vas')

      expect(sentBody()).toEqual({ search_text: 'vas', size: 6 })
    })

    it('returns id, symbol, name, kind and issuer in the app format', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          results: [
            {
              symbol: 'VAS',
              symbol_openfigi: 'VAS:AU',
              display_name: 'Vanguard Australian Shares',
              kind: 'etf',
              issuer: 'vanguard',
            },
            {
              symbol: 'CBA',
              symbol_openfigi: 'CBA:AU',
              display_name: 'Commonwealth Bank',
              kind: 'equity',
              issuer: null,
            },
          ],
          count: 2,
          indexed_at: 1,
        }),
      )

      expect(await api.getSuggestions('a')).toEqual({
        results: [
          {
            id: 'VAS:AU',
            symbol: 'VAS',
            name: 'Vanguard Australian Shares',
            kind: 'etf',
            issuer: 'vanguard',
          },
          { id: 'CBA:AU', symbol: 'CBA', name: 'Commonwealth Bank', kind: 'share', issuer: null },
        ],
        count: 2,
      })
    })
  })

  describe('getFlagshipFunds', () => {
    it('searches for flagship funds with light fields and a small size', async () => {
      await api.getFlagshipFunds()

      expect(lastCall().url).toBe(
        '/api/search?fields=symbol%2Csymbol_openfigi%2Cdisplay_name%2Ckind%2Cissuer',
      )
      expect(sentBody()).toEqual({ is_flagship_fund: { value: true }, size: 4 })
    })

    it('uses the size it is given', async () => {
      await api.getFlagshipFunds({ size: 2 })

      expect(sentBody()).toEqual({ is_flagship_fund: { value: true }, size: 2 })
    })

    it('returns the suggestions in the app format', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          results: [
            {
              symbol: 'A200',
              symbol_openfigi: 'A200:AU',
              display_name: 'Australia 200',
              kind: 'etf',
              issuer: 'betashares',
            },
          ],
          count: 9,
          indexed_at: 1,
        }),
      )

      expect(await api.getFlagshipFunds()).toEqual({
        results: [
          {
            id: 'A200:AU',
            symbol: 'A200',
            name: 'Australia 200',
            kind: 'etf',
            issuer: 'betashares',
          },
        ],
        count: 9,
      })
    })
  })

  describe('getFacetCounts', () => {
    // The facet endpoint answers with a list of counts.
    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse([]))
    })

    it('POSTs the text and filters to /api/facets/:key', async () => {
      await api.getFacetCounts('kind', {
        text: 'bonds',
        filters: { ...noFilters, isBetashares: true },
      })

      const { url, options } = lastCall()
      expect(url).toBe('/api/facets/kind')
      expect(options.method).toBe('POST')
      expect(sentBody()).toEqual({ search_text: 'bonds', is_betashares: { value: true } })
    })

    it('adds omit_empty_counts when asked', async () => {
      await api.getFacetCounts('issuer', {}, { omitEmptyCounts: true })

      expect(lastCall().url).toBe('/api/facets/issuer?omit_empty_counts=true')
    })

    it('returns the counts', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ value: 'vanguard', count: 5 }]))

      expect(await api.getFacetCounts('issuer')).toEqual([{ value: 'vanguard', count: 5 }])
    })

    it('uses the app kinds for the kind counts', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          { value: 'equity', count: 378 },
          { value: 'etf', count: 456 },
        ]),
      )

      expect(await api.getFacetCounts('kind')).toEqual([
        { value: 'share', count: 378 },
        { value: 'etf', count: 456 },
      ])
    })
  })

  describe('getFlagCount', () => {
    // A new response for each call, because a response body can only be read once.
    beforeEach(() => {
      fetchMock.mockImplementation(() => Promise.resolve(jsonResponse([])))
    })

    it('POSTs the text and filters to the facet for the flag, with the API name', async () => {
      await api.getFlagCount('isBetashares', {
        text: 'bonds',
        filters: { ...noFilters, kind: ['etf'] },
      })

      const { url, options } = lastCall()
      expect(url).toBe('/api/facets/is_betashares')
      expect(options.method).toBe('POST')
      expect(sentBody()).toEqual({ search_text: 'bonds', kind: ['etf'] })
    })

    it('uses the API name for every flag', async () => {
      await api.getFlagCount('isFlagshipFund')
      expect(lastCall().url).toBe('/api/facets/is_flagship_fund')

      fetchMock.mockClear()
      await api.getFlagCount('isAutoInvestIncluded')
      expect(lastCall().url).toBe('/api/facets/is_auto_invest_included')
    })

    it('returns how many results have the flag on', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          { value: 'true', count: 102 },
          { value: 'false', count: 732 },
        ]),
      )

      expect(await api.getFlagCount('isBetashares')).toBe(102)
    })

    it('returns 0 when no result has the flag on', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ value: 'false', count: 5 }]))
      expect(await api.getFlagCount('isBetashares')).toBe(0)

      fetchMock.mockResolvedValue(jsonResponse([]))
      expect(await api.getFlagCount('isBetashares')).toBe(0)
    })
  })

  describe('getInstrument', () => {
    it('GETs the encoded id and returns the instrument in the app format', async () => {
      fetchMock.mockResolvedValue(jsonResponse(API_A200))

      const instrument = await api.getInstrument('A200:AU')

      const { url, options } = lastCall()
      expect(url).toBe('/api/instruments/A200%3AAU')
      expect(options.method).toBe('GET')
      expect(instrument).toEqual(APP_A200)
    })
  })

  describe('errors', () => {
    it('throws the API message and status for a non-OK response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Bad query' }, 400))

      await expect(api.search({ page: -1 })).rejects.toMatchObject({
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

      await expect(api.getInstrument('A200:AU')).rejects.toThrow('Failed to fetch')
    })
  })
})
