import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useSearchStore } from '../search'

const api = vi.hoisted(() => ({
  search: vi.fn(),
  getSuggestions: vi.fn(),
  getFacetCounts: vi.fn(),
}))

vi.mock('../../composables/useSearchApi', () => ({ useSearchApi: () => api }))

const noFilters = { kind: [], issuer: [], is_betashares: null, is_flagship_fund: null }

const A200 = { symbol: 'A200', display_name: 'Betashares Australia 200 ETF' }

function searchResponse(results: object[] = [A200], count = results.length) {
  return { results, count, indexed_at: 1 }
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
        is_betashares: null,
        is_flagship_fund: null,
      })
      expect(store.sortBy).toBe('')
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
        sort: '',
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
      await store.setFilter('is_betashares', true)
      await store.setFilter('is_flagship_fund', false)

      expect(lastSearchQuery()).toMatchObject({
        filters: { is_betashares: true, is_flagship_fund: false },
      })
    })

    it('setSort sends the sort', async () => {
      await store.setSort('symbol.asc')

      expect(lastSearchQuery()).toMatchObject({ sort: 'symbol.asc' })
    })

    it('setPage sends the 1-based page', async () => {
      await store.setPage(3)

      expect(store.page).toBe(3)
      expect(lastSearchQuery()).toMatchObject({ page: 3 })
    })

    it.each([
      ['setQuery', () => store.setQuery('vas')],
      ['setFilter', () => store.setFilter('kind', ['etf'])],
      ['setSort', () => store.setSort('symbol.asc')],
      ['clearFilters', () => store.clearFilters()],
    ])('%s goes back to the first page', async (_name, action) => {
      await store.setPage(4)

      await action()

      expect(store.page).toBe(1)
      expect(lastSearchQuery()).toMatchObject({ page: 1 })
    })

    it('clearFilters resets every filter but keeps the query and sort', async () => {
      await store.setQuery('bonds')
      await store.setSort('symbol.asc')
      await store.setFilter('kind', ['etf'])
      await store.setFilter('is_betashares', true)

      await store.clearFilters()

      expect(lastSearchQuery()).toEqual({
        text: 'bonds',
        filters: noFilters,
        sort: 'symbol.asc',
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
      second.resolve(searchResponse([{ symbol: 'VAS' }]))
      await secondDone
      first.resolve(searchResponse([{ symbol: 'VAF' }]))
      await firstDone

      expect(store.results).toEqual([{ symbol: 'VAS' }])
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

      expect(api.getSuggestions).toHaveBeenCalledWith('a200', { signal: expect.any(AbortSignal) })
      expect(store.suggestions).toEqual([A200])
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
    })

    it('shows no suggestions when the request fails, without setting an error', async () => {
      await store.loadSuggestions('a200')
      api.getSuggestions.mockRejectedValue(new Error('Failed'))

      await store.loadSuggestions('a2')

      expect(store.suggestions).toEqual([])
      expect(store.error).toBeNull()
      expect(store.status).toBe('idle')
    })

    it('ignores an older response that arrives after a newer one', async () => {
      const first = deferred()
      const second = deferred()
      api.getSuggestions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

      const firstDone = store.loadSuggestions('va')
      const secondDone = store.loadSuggestions('vas')
      second.resolve({ results: [{ symbol: 'VAS' }] })
      await secondDone
      first.resolve({ results: [{ symbol: 'VAF' }] })
      await firstDone

      expect(store.suggestions).toEqual([{ symbol: 'VAS' }])
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

  describe('facets', () => {
    it('loads counts for a key using the text and filters, without empty counts', async () => {
      api.getFacetCounts.mockResolvedValue([{ value: 'etf', count: 5 }])
      await store.setQuery('bonds')
      await store.setFilter('is_betashares', true)
      await store.setSort('symbol.asc')
      await store.setPage(2)

      await store.loadFacet('kind')

      expect(api.getFacetCounts).toHaveBeenCalledWith(
        'kind',
        { text: 'bonds', filters: { ...noFilters, is_betashares: true } },
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
})
