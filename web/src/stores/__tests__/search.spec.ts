import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { HttpError } from '../../utils/httpClient'
import { useSearchStore } from '../search'

const api = vi.hoisted(() => ({
  search: vi.fn(),
  getSuggestions: vi.fn(),
  getFlagshipFunds: vi.fn(),
  getFacetCounts: vi.fn(),
  getFlagCount: vi.fn(),
  getInstrument: vi.fn(),
}))

vi.mock('../../composables/useSearchApi', () => ({ useSearchApi: () => api }))

const noFilters = {
  kind: [],
  issuer: [],
  isBetashares: null,
  isFlagshipFund: null,
  isAutoInvestIncluded: null,
}
const SYMBOL_ASC = { field: 'symbol', direction: 'asc' } as const

const A200 = { symbol: 'A200', name: 'Betashares Australia 200 ETF' }

function searchResponse(results: object[] = [A200], count = results.length) {
  return { results, count }
}

// A promise the test resolves or rejects by hand, to control the order responses arrive in.
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// The AbortSignal an API function was called with. The options object is always the last argument.
function signalOf(mock: Mock, callIndex: number): AbortSignal {
  const args = mock.mock.calls[callIndex] ?? []
  return (args[args.length - 1] as { signal: AbortSignal }).signal
}

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

describe('search store', () => {
  let store: ReturnType<typeof useSearchStore>

  beforeEach(() => {
    vi.resetAllMocks()
    api.search.mockResolvedValue(searchResponse())
    api.getSuggestions.mockResolvedValue({ results: [A200] })
    api.getFacetCounts.mockResolvedValue([])
    api.getFlagCount.mockResolvedValue(0)
    api.getFlagshipFunds.mockResolvedValue({ results: [A200], count: 1 })
    setActivePinia(createPinia())
    store = useSearchStore()
  })

  function lastSearchQuery() {
    const calls = api.search.mock.calls
    return calls[calls.length - 1]?.[0]
  }

  describe('initial state', () => {
    it('starts idle with no query, filters or results, and makes no request', () => {
      expect(store.query).toBe('')
      expect(store.filters).toEqual({
        kind: [],
        issuer: [],
        isBetashares: null,
        isFlagshipFund: null,
        isAutoInvestIncluded: null,
      })
      expect(store.sortBy).toBeNull()
      expect(store.page).toBe(1)
      expect(store.results).toEqual([])
      expect(store.count).toBe(0)
      expect(store.status).toBe('idle')
      expect(store.error).toBeNull()
      expect(api.search).not.toHaveBeenCalled()
    })
  })

  describe('search', () => {
    it('sends the first page and default size with no text, filters or sort', async () => {
      await store.search()

      expect(lastSearchQuery()).toEqual({
        text: '',
        filters: noFilters,
        sort: null,
        page: 1,
        size: 15,
      })
    })

    it('stores the results and count and ends as success', async () => {
      api.search.mockResolvedValue(searchResponse([A200], 42))

      await store.search()

      expect(store.results).toEqual([A200])
      expect(store.count).toBe(42)
      expect(store.status).toBe('success')
    })

    it('is loading while the request is pending', async () => {
      const pending = deferred()
      api.search.mockReturnValue(pending.promise)

      const done = store.search()
      expect(store.status).toBe('loading')

      pending.resolve(searchResponse())
      await done
      expect(store.status).toBe('success')
    })

    it('clears the results and keeps the message when the request fails', async () => {
      await store.search()
      api.search.mockRejectedValue(Object.assign(new Error('Bad query'), { status: 400 }))

      await store.search()

      expect(store.status).toBe('error')
      expect(store.error).toBe('Bad query')
      expect(store.results).toEqual([])
      expect(store.count).toBe(0)
    })

    it('clears an earlier error when it starts again', async () => {
      api.search.mockRejectedValueOnce(new Error('Failed'))
      await store.search()

      await store.search()

      expect(store.error).toBeNull()
      expect(store.status).toBe('success')
    })
  })

  describe('query, filters and sort', () => {
    it('setQuery sends the text', async () => {
      await store.setQuery('a200')

      expect(store.query).toBe('a200')
      expect(lastSearchQuery()).toMatchObject({ text: 'a200', page: 1 })
    })

    it('setFilter sends multi-select filters as lists', async () => {
      await store.setFilter('kind', ['etf'])
      await store.setFilter('issuer', ['betashares', 'vaneck'])

      expect(lastSearchQuery()).toMatchObject({
        filters: { kind: ['etf'], issuer: ['betashares', 'vaneck'] },
      })
    })

    it('setFilter keeps a false boolean', async () => {
      await store.setFilter('isBetashares', true)
      await store.setFilter('isFlagshipFund', false)

      expect(lastSearchQuery()).toMatchObject({
        filters: { isBetashares: true, isFlagshipFund: false },
      })
    })

    it('setSort sends the sort', async () => {
      await store.setSort(SYMBOL_ASC)

      expect(lastSearchQuery()).toMatchObject({ sort: SYMBOL_ASC })
    })

    it('setPageSize sends the size and goes back to the first page', async () => {
      await store.setPage(3)

      await store.setPageSize(30)

      expect(store.pageSize).toBe(30)
      expect(lastSearchQuery()).toMatchObject({ page: 1, size: 30 })
    })

    it('setPage sends the 1-based page', async () => {
      await store.setPage(3)

      expect(store.page).toBe(3)
      expect(lastSearchQuery()).toMatchObject({ page: 3 })
    })

    it.each([
      ['setQuery', () => store.setQuery('vas')],
      ['setFilter', () => store.setFilter('kind', ['etf'])],
      ['setSort', () => store.setSort(SYMBOL_ASC)],
      ['clearFilters', () => store.clearFilters()],
    ])('%s goes back to the first page', async (_name, action) => {
      await store.setPage(4)

      await action()

      expect(store.page).toBe(1)
      expect(lastSearchQuery()).toMatchObject({ page: 1 })
    })

    it('clearFilters resets every filter but keeps the query and sort', async () => {
      await store.setQuery('bonds')
      await store.setSort(SYMBOL_ASC)
      await store.setFilter('kind', ['etf'])
      await store.setFilter('isBetashares', true)

      await store.clearFilters()

      expect(lastSearchQuery()).toEqual({
        text: 'bonds',
        filters: noFilters,
        sort: SYMBOL_ASC,
        page: 1,
        size: 15,
      })
    })
  })

  describe('computed state', () => {
    it('totalPages rounds up from count and page size', async () => {
      api.search.mockResolvedValue(searchResponse([A200], 31))

      await store.search()

      expect(store.totalPages).toBe(3)
    })

    it('isEmpty is true only for a successful search with no results', async () => {
      expect(store.isEmpty).toBe(false)

      api.search.mockResolvedValue(searchResponse([], 0))
      await store.search()
      expect(store.isEmpty).toBe(true)

      api.search.mockRejectedValue(new Error('Failed'))
      await store.search()
      expect(store.isEmpty).toBe(false)
    })
  })

  describe('stale searches', () => {
    it('aborts the previous search when a new one starts', () => {
      api.search.mockReturnValue(new Promise(() => {}))

      store.search()
      store.search()

      expect(signalOf(api.search, 0).aborted).toBe(true)
      expect(signalOf(api.search, 1).aborted).toBe(false)
    })

    it('ignores an older response that arrives after a newer one', async () => {
      const first = deferred()
      const second = deferred()
      api.search.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

      // The first request is slow, so its response arrives after the second one's.
      const firstDone = store.setQuery('va')
      const secondDone = store.setQuery('vas')
      second.resolve(searchResponse([{ symbol: 'VAS', name: 'Vanguard Australian Shares' }]))
      await secondDone
      first.resolve(searchResponse([{ symbol: 'VAF', name: 'Vanguard Australian Fixed' }]))
      await firstDone

      expect(store.results).toEqual([{ symbol: 'VAS', name: 'Vanguard Australian Shares' }])
      expect(store.status).toBe('success')
    })

    it('treats an abort as neither an error nor a result', async () => {
      const first = deferred()
      const second = deferred()
      api.search.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

      const firstDone = store.search()
      const secondDone = store.search()
      first.reject(abortError())
      await firstDone

      expect(store.status).toBe('loading')
      expect(store.error).toBeNull()

      second.resolve(searchResponse())
      await secondDone
      expect(store.status).toBe('success')
    })
  })

  describe('suggestions', () => {
    it('loads suggestions for the text', async () => {
      await store.loadSuggestions('a200')

      expect(api.getSuggestions).toHaveBeenCalledWith('a200', {
        size: 5,
        signal: expect.any(AbortSignal),
      })
      expect(store.suggestions).toEqual([A200])
    })

    it('also loads the ETF and share counts for the text', async () => {
      api.getFacetCounts.mockResolvedValue([
        { value: 'etf', count: 8 },
        { value: 'share', count: 3 },
      ])

      await store.loadSuggestions('bank')

      expect(api.getFacetCounts).toHaveBeenCalledWith(
        'kind',
        { text: 'bank' },
        { omitEmptyCounts: true, signal: expect.any(AbortSignal) },
      )
      expect(store.suggestionKinds).toEqual([
        { value: 'etf', count: 8 },
        { value: 'share', count: 3 },
      ])
    })

    it('does not touch the search results or status', async () => {
      await store.loadSuggestions('a200')

      expect(api.search).not.toHaveBeenCalled()
      expect(store.status).toBe('idle')
    })

    it('clears the suggestions without a request for blank text', async () => {
      await store.loadSuggestions('a200')

      await store.loadSuggestions('   ')

      expect(api.getSuggestions).toHaveBeenCalledTimes(1)
      expect(store.suggestions).toEqual([])
      expect(store.suggestionKinds).toEqual([])
    })

    it('shows no suggestions when the request fails, without setting an error', async () => {
      await store.loadSuggestions('a200')
      api.getSuggestions.mockRejectedValue(new Error('Failed'))

      await store.loadSuggestions('a2')

      expect(store.suggestions).toEqual([])
      expect(store.suggestionKinds).toEqual([])
      expect(store.error).toBeNull()
      expect(store.status).toBe('idle')
    })

    it('ignores an older response that arrives after a newer one', async () => {
      const first = deferred()
      const second = deferred()
      api.getSuggestions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

      const firstDone = store.loadSuggestions('va')
      const secondDone = store.loadSuggestions('vas')
      second.resolve({ results: [{ symbol: 'VAS', name: 'Vanguard Australian Shares' }] })
      await secondDone
      first.resolve({ results: [{ symbol: 'VAF', name: 'Vanguard Australian Fixed' }] })
      await firstDone

      expect(store.suggestions).toEqual([{ symbol: 'VAS', name: 'Vanguard Australian Shares' }])
    })

    it('clearSuggestions empties the list and cancels a pending request', async () => {
      const pending = deferred()
      api.getSuggestions.mockReturnValue(pending.promise)

      const done = store.loadSuggestions('vas')
      store.clearSuggestions()
      pending.resolve({ results: [A200] })
      await done

      expect(store.suggestions).toEqual([])
    })
  })

  describe('flagship funds', () => {
    it('loads the flagship funds', async () => {
      await store.loadFlagshipFunds()

      expect(store.flagshipFunds).toEqual([A200])
    })

    it('shows none when the request fails, without setting an error', async () => {
      api.getFlagshipFunds.mockRejectedValue(new Error('Failed'))

      await store.loadFlagshipFunds()

      expect(store.flagshipFunds).toEqual([])
      expect(store.error).toBeNull()
    })
  })

  describe('facets', () => {
    it('loads counts for a key using the text and filters, without empty counts', async () => {
      api.getFacetCounts.mockResolvedValue([{ value: 'etf', count: 5 }])
      await store.setQuery('bonds')
      await store.setFilter('isBetashares', true)
      await store.setSort(SYMBOL_ASC)
      await store.setPage(2)

      await store.loadFacet('kind')

      expect(api.getFacetCounts).toHaveBeenCalledWith(
        'kind',
        { text: 'bonds', filters: { ...noFilters, isBetashares: true } },
        { omitEmptyCounts: true, signal: expect.any(AbortSignal) },
      )
      expect(store.facets.kind).toEqual([{ value: 'etf', count: 5 }])
    })

    it('keeps each key separate', async () => {
      api.getFacetCounts
        .mockResolvedValueOnce([{ value: 'etf', count: 5 }])
        .mockResolvedValueOnce([{ value: 'vaneck', count: 2 }])

      await store.loadFacet('kind')
      await store.loadFacet('issuer')

      expect(store.facets).toEqual({
        kind: [{ value: 'etf', count: 5 }],
        issuer: [{ value: 'vaneck', count: 2 }],
      })
    })

    it('aborts the previous request for the same key', () => {
      api.getFacetCounts.mockReturnValue(new Promise(() => {}))

      store.loadFacet('kind')
      store.loadFacet('kind')

      expect(signalOf(api.getFacetCounts, 0).aborted).toBe(true)
      expect(signalOf(api.getFacetCounts, 1).aborted).toBe(false)
    })

    it('does not abort the request for a different key', () => {
      api.getFacetCounts.mockReturnValue(new Promise(() => {}))

      store.loadFacet('kind')
      store.loadFacet('issuer')

      expect(signalOf(api.getFacetCounts, 0).aborted).toBe(false)
    })

    it('shows no options for a key when its request fails', async () => {
      api.getFacetCounts.mockRejectedValue(new Error('Failed'))

      await store.loadFacet('kind')

      expect(store.facets.kind).toEqual([])
      expect(store.status).toBe('idle')
    })
  })
  describe('yes/no filter counts', () => {
    it('loads the count using the text and filters, but not sort or page', async () => {
      api.getFlagCount.mockResolvedValue(19)
      await store.setQuery('bond')
      await store.setFilter('kind', ['etf'])
      await store.setSort(SYMBOL_ASC)
      await store.setPage(2)

      await store.loadFlagCount('isBetashares')

      expect(api.getFlagCount).toHaveBeenCalledWith(
        'isBetashares',
        { text: 'bond', filters: { ...noFilters, kind: ['etf'] } },
        { signal: expect.any(AbortSignal) },
      )
      expect(store.flagCounts.isBetashares).toBe(19)
    })

    it('keeps each flag separate, and apart from the text filter options', async () => {
      api.getFlagCount.mockResolvedValueOnce(19).mockResolvedValueOnce(9)

      await store.loadFlagCount('isBetashares')
      await store.loadFlagCount('isFlagshipFund')

      expect(store.flagCounts).toEqual({ isBetashares: 19, isFlagshipFund: 9 })
      expect(store.facets).toEqual({})
    })

    it('aborts the previous request for the same flag, but not for another', () => {
      api.getFlagCount.mockReturnValue(new Promise(() => {}))

      store.loadFlagCount('isBetashares')
      store.loadFlagCount('isFlagshipFund')
      store.loadFlagCount('isBetashares')

      expect(signalOf(api.getFlagCount, 0).aborted).toBe(true)
      expect(signalOf(api.getFlagCount, 1).aborted).toBe(false)
      expect(signalOf(api.getFlagCount, 2).aborted).toBe(false)
    })

    it('leaves the count out when the request fails', async () => {
      api.getFlagCount.mockResolvedValueOnce(19)
      await store.loadFlagCount('isBetashares')
      api.getFlagCount.mockRejectedValue(new Error('Failed'))

      await store.loadFlagCount('isBetashares')

      expect(store.flagCounts.isBetashares).toBeUndefined()
      expect(store.status).toBe('idle')
    })
  })
  describe('instrument details', () => {
    it('starts with nothing loaded', () => {
      expect(store.instrument).toBeNull()
      expect(store.instrumentStatus).toBe('idle')
    })

    it('loads one instrument by id', async () => {
      api.getInstrument.mockResolvedValue(A200)

      await store.loadInstrument('A200:AU')

      expect(api.getInstrument).toHaveBeenCalledWith('A200:AU', { signal: expect.any(AbortSignal) })
      expect(store.instrument).toEqual(A200)
      expect(store.instrumentStatus).toBe('success')
    })

    it('is loading, with no instrument, while the request is pending', async () => {
      const pending = deferred()
      api.getInstrument.mockReturnValue(pending.promise)

      const done = store.loadInstrument('A200:AU')
      expect(store.instrumentStatus).toBe('loading')
      expect(store.instrument).toBeNull()

      pending.resolve(A200)
      await done
      expect(store.instrumentStatus).toBe('success')
    })

    it('reports an instrument that does not exist apart from other failures', async () => {
      api.getInstrument.mockRejectedValue(new HttpError('Instrument not found: NOPE:AU', 404))

      await store.loadInstrument('NOPE:AU')

      expect(store.instrumentStatus).toBe('not-found')
      expect(store.instrument).toBeNull()
    })

    it('reports any other failure as an error', async () => {
      api.getInstrument.mockRejectedValue(new HttpError('Server error', 500))
      await store.loadInstrument('A200:AU')
      expect(store.instrumentStatus).toBe('error')

      api.getInstrument.mockRejectedValue(new TypeError('Failed to fetch'))
      await store.loadInstrument('A200:AU')
      expect(store.instrumentStatus).toBe('error')
    })

    it('does not touch the search results or status', async () => {
      api.getInstrument.mockResolvedValue(A200)

      await store.loadInstrument('A200:AU')

      expect(store.status).toBe('idle')
      expect(api.search).not.toHaveBeenCalled()
    })

    it('forgets the earlier instrument as soon as another one starts loading', async () => {
      api.getInstrument.mockResolvedValue(A200)
      await store.loadInstrument('A200:AU')

      api.getInstrument.mockReturnValue(new Promise(() => {}))
      store.loadInstrument('VAS:AU')

      expect(store.instrument).toBeNull()
      expect(store.instrumentStatus).toBe('loading')
    })

    it('ignores an older response that arrives after a newer one', async () => {
      const first = deferred()
      const second = deferred()
      api.getInstrument.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

      const firstDone = store.loadInstrument('A200:AU')
      const secondDone = store.loadInstrument('VAS:AU')
      second.resolve({ symbol: 'VAS' })
      await secondDone
      first.resolve({ symbol: 'A200' })
      await firstDone

      expect(store.instrument).toEqual({ symbol: 'VAS' })
      expect(signalOf(api.getInstrument, 0).aborted).toBe(true)
    })

    it('clearInstrument forgets the instrument and cancels a pending request', async () => {
      const pending = deferred()
      api.getInstrument.mockReturnValue(pending.promise)

      const done = store.loadInstrument('A200:AU')
      store.clearInstrument()
      pending.resolve(A200)
      await done

      expect(store.instrument).toBeNull()
      expect(store.instrumentStatus).toBe('idle')
    })
  })
})
