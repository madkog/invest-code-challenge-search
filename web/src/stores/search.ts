import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { useSearchApi } from '../composables/useSearchApi'
import { HttpError } from '../utils/httpClient'
import { logError } from '../utils/logError'
import { createRequestTracker } from '../utils/requestTracker'
import type {
  FacetCount,
  FacetKey,
  FlagKey,
  Filters,
  Instrument,
  SearchParams,
  Sort,
  Suggestion,
} from '../types/search'

const DEFAULT_PAGE_SIZE = 15
export const SEARCH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const
export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS]

export const DETAIL_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  NOT_FOUND: 'not-found',
  ERROR: 'error',
} as const
export type DetailStatus = (typeof DETAIL_STATUS)[keyof typeof DETAIL_STATUS]

function createEmptyFilters(): Filters {
  return {
    kind: [],
    issuer: [],
    isBetashares: null,
    isFlagshipFund: null,
    isAutoInvestIncluded: null,
  }
}

/**
 * Shared search state: query, filters, sort, page, results and status.
 * Only the search page uses this store. It calls the API composable and nothing else.
 *
 * Each action changes the state and sends its request. A newer request of the same kind cancels
 * the older one, so a stale result is ignored.
 */
export const useSearchStore = defineStore('search', () => {
  const api = useSearchApi()
  const requests = createRequestTracker()

  // Request state
  const query = ref('')
  const filters = ref<Filters>(createEmptyFilters())
  const sortBy = ref<Sort | null>(null) // null means ranked by relevance.
  const page = ref(1) // 1-based, as the API expects.
  const pageSize = ref(DEFAULT_PAGE_SIZE)

  // Response state
  const results = ref<Instrument[]>([])
  const count = ref(0)
  const status = ref<SearchStatus>(SEARCH_STATUS.IDLE)
  const suggestions = ref<Suggestion[]>([])
  const suggestionKinds = ref<FacetCount[]>([]) // ETF and share counts for the typed text
  const flagshipFunds = ref<Suggestion[]>([]) // suggested when the box is empty
  const facets = ref<Partial<Record<FacetKey, FacetCount[]>>>({}) // facet key -> counts
  const flagCounts = ref<Partial<Record<FlagKey, number>>>({}) // yes/no filter -> count
  const instrument = ref<Instrument | null>(null) // the one shown in the details
  const instrumentStatus = ref<DetailStatus>(DETAIL_STATUS.IDLE)

  const isEmpty = computed(
    () => status.value === SEARCH_STATUS.SUCCESS && results.value.length === 0,
  )

  // The text and filters only. Used for facet counts, which ignore sort and page.
  const filterParams = computed<SearchParams>(() => ({
    text: query.value,
    filters: filters.value,
  }))

  const searchParams = computed<SearchParams>(() => ({
    ...filterParams.value,
    sort: sortBy.value,
    page: page.value,
    size: pageSize.value,
  }))

  async function search() {
    const request = requests.start('search')

    status.value = SEARCH_STATUS.LOADING

    try {
      const response = await api.search(searchParams.value, { signal: request.signal })
      if (!request.isCurrent()) return
      results.value = response.results
      count.value = response.count
      status.value = SEARCH_STATUS.SUCCESS
    } catch (caught) {
      if (!request.isCurrent()) return
      logError('Search failed', caught, { params: searchParams.value })
      results.value = []
      count.value = 0
      status.value = SEARCH_STATUS.ERROR
    }
  }

  // Changing the query, filters or sort starts again from the first page.
  function setQuery(text: string) {
    query.value = text
    page.value = 1
    return search()
  }

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    filters.value[key] = value
    page.value = 1
    return search()
  }

  function clearFilters() {
    filters.value = createEmptyFilters()
    page.value = 1
    return search()
  }

  function setSort(sort: Sort | null) {
    sortBy.value = sort
    page.value = 1
    return search()
  }

  function setPage(newPage: number) {
    page.value = newPage
    return search()
  }

  function setPageSize(size: number) {
    pageSize.value = size
    page.value = 1
    return search()
  }

  // A failed suggestion request shows no suggestions instead of an error, because they are optional.
  async function loadSuggestions(text: string) {
    if (!text.trim()) {
      clearSuggestions()
      return
    }

    const request = requests.start('suggestions')

    try {
      const { signal } = request
      // The matching instruments and the ETF and share counts are requested together.
      const [matches, kinds] = await Promise.all([
        api.getSuggestions(text, { signal }),
        api.getFacetCounts('kind', { text }, { signal }),
      ])
      if (!request.isCurrent()) return
      suggestions.value = matches.results
      suggestionKinds.value = kinds
    } catch (caught) {
      if (!request.isCurrent()) return
      logError('Loading suggestions failed', caught, { text })
      suggestions.value = []
      suggestionKinds.value = []
    }
  }

  function clearSuggestions() {
    requests.cancel('suggestions')
    suggestions.value = []
    suggestionKinds.value = []
  }

  // Not being able to load these just leaves that group out.
  async function loadFlagshipFunds() {
    try {
      flagshipFunds.value = (await api.getFlagshipFunds()).results
    } catch (caught) {
      logError('Loading flagship funds failed', caught)
      flagshipFunds.value = []
    }
  }

  async function loadFacet(key: FacetKey) {
    const request = requests.start(`facet:${key}`)

    try {
      const counts = await api.getFacetCounts(key, filterParams.value, { signal: request.signal })
      if (request.isCurrent()) facets.value[key] = counts
    } catch (caught) {
      if (!request.isCurrent()) return
      logError('Loading filter options failed', caught, { key })
      facets.value[key] = []
    }
  }

  // A failed request leaves the count out, so nothing wrong is shown.
  async function loadFlagCount(key: FlagKey) {
    const request = requests.start(`flag:${key}`)

    try {
      const count = await api.getFlagCount(key, filterParams.value, { signal: request.signal })
      if (request.isCurrent()) flagCounts.value[key] = count
    } catch (caught) {
      if (!request.isCurrent()) return
      logError('Loading filter count failed', caught, { key })
      flagCounts.value[key] = undefined
    }
  }

  // Loads one instrument for the details. A missing one is reported apart from other failures.
  async function loadInstrument(id: string) {
    const request = requests.start('instrument')

    instrument.value = null
    instrumentStatus.value = DETAIL_STATUS.LOADING

    try {
      const found = await api.getInstrument(id, { signal: request.signal })
      if (!request.isCurrent()) return
      instrument.value = found
      instrumentStatus.value = DETAIL_STATUS.SUCCESS
    } catch (caught) {
      if (!request.isCurrent()) return
      if (caught instanceof HttpError && caught.status === 404) {
        instrumentStatus.value = DETAIL_STATUS.NOT_FOUND
        return
      }
      logError('Loading details failed', caught, { id })
      instrumentStatus.value = DETAIL_STATUS.ERROR
    }
  }

  function clearInstrument() {
    requests.cancel('instrument')
    instrument.value = null
    instrumentStatus.value = DETAIL_STATUS.IDLE
  }

  return {
    query,
    filters,
    sortBy,
    page,
    pageSize,
    results,
    count,
    status,
    suggestions,
    suggestionKinds,
    flagshipFunds,
    facets,
    flagCounts,
    instrument,
    instrumentStatus,
    isEmpty,
    search,
    setQuery,
    setFilter,
    clearFilters,
    setSort,
    setPage,
    setPageSize,
    loadSuggestions,
    clearSuggestions,
    loadFlagshipFunds,
    loadFacet,
    loadFlagCount,
    loadInstrument,
    clearInstrument,
  }
})
