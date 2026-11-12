import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { useSearchApi } from '../composables/useSearchApi'
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
const SUGGESTION_SIZE = 5
export const SEARCH_STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const)
export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS]

function createEmptyFilters(): Filters {
  return {
    kind: [],
    issuer: [],
    isBetashares: null,
    isFlagshipFund: null,
    isAutoInvestIncluded: null,
  }
}

function getMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}

/**
 * Shared search state: query, filters, sort, page, results and status.
 * Only the search page uses this store. It calls the API composable and nothing else.
 *
 * Each action changes the state and sends its request. Each kind of request keeps its own
 * AbortController, so a newer request aborts the older one and a stale result is ignored.
 */
export const useSearchStore = defineStore('search', () => {
  const api = useSearchApi()

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
  const error = ref<string | null>(null)
  const suggestions = ref<Suggestion[]>([])
  const suggestionKinds = ref<FacetCount[]>([]) // ETF and share counts for the typed text
  const flagshipFunds = ref<Suggestion[]>([]) // suggested when the box is empty
  const facets = ref<Partial<Record<FacetKey, FacetCount[]>>>({}) // facet key -> counts
  const flagCounts = ref<Partial<Record<FlagKey, number>>>({}) // yes/no filter -> count

  const totalPages = computed(() => Math.ceil(count.value / pageSize.value))
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

  let searchController: AbortController | null = null
  let suggestionsController: AbortController | null = null
  const facetControllers: Partial<Record<FacetKey, AbortController>> = {} // one per facet key
  const flagControllers: Partial<Record<FlagKey, AbortController>> = {} // one per yes/no filter

  async function search() {
    searchController?.abort()
    const controller = new AbortController()
    searchController = controller

    status.value = SEARCH_STATUS.LOADING
    error.value = null

    try {
      const response = await api.search(searchParams.value, { signal: controller.signal })
      if (controller.signal.aborted) return
      results.value = response.results
      count.value = response.count
      status.value = SEARCH_STATUS.SUCCESS
    } catch (caught) {
      if (controller.signal.aborted) return
      results.value = []
      count.value = 0
      error.value = getMessage(caught)
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

    suggestionsController?.abort()
    const controller = new AbortController()
    suggestionsController = controller

    try {
      const { signal } = controller
      // The matching instruments and the ETF and share counts are requested together.
      const [matches, kinds] = await Promise.all([
        api.getSuggestions(text, { size: SUGGESTION_SIZE, signal }),
        api.getFacetCounts('kind', { text }, { omitEmptyCounts: true, signal }),
      ])
      if (signal.aborted) return
      suggestions.value = matches.results
      suggestionKinds.value = kinds
    } catch {
      if (controller.signal.aborted) return
      suggestions.value = []
      suggestionKinds.value = []
    }
  }

  function clearSuggestions() {
    suggestionsController?.abort()
    suggestions.value = []
    suggestionKinds.value = []
  }

  // Not being able to load these just leaves that group out.
  async function loadFlagshipFunds() {
    try {
      flagshipFunds.value = (await api.getFlagshipFunds()).results
    } catch {
      flagshipFunds.value = []
    }
  }

  async function loadFacet(key: FacetKey) {
    facetControllers[key]?.abort()
    const controller = new AbortController()
    facetControllers[key] = controller

    try {
      const counts = await api.getFacetCounts(key, filterParams.value, {
        omitEmptyCounts: true,
        signal: controller.signal,
      })
      if (!controller.signal.aborted) facets.value[key] = counts
    } catch {
      if (!controller.signal.aborted) facets.value[key] = []
    }
  }

  // A failed request leaves the count out, so nothing wrong is shown.
  async function loadFlagCount(key: FlagKey) {
    flagControllers[key]?.abort()
    const controller = new AbortController()
    flagControllers[key] = controller

    try {
      const count = await api.getFlagCount(key, filterParams.value, { signal: controller.signal })
      if (!controller.signal.aborted) flagCounts.value[key] = count
    } catch {
      if (!controller.signal.aborted) flagCounts.value[key] = undefined
    }
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
    error,
    suggestions,
    suggestionKinds,
    flagshipFunds,
    facets,
    flagCounts,
    totalPages,
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
  }
})
