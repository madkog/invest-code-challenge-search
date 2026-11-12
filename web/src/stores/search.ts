import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { useSearchApi } from '../composables/useSearchApi'
import type { FacetCount, Filters, Instrument, SearchParams, Suggestion } from '../types/search'

const DEFAULT_PAGE_SIZE = 15
export const SEARCH_STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const)
export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS]

function createEmptyFilters(): Filters {
  return { kind: [], issuer: [], is_betashares: null, is_flagship_fund: null }
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
  const sortBy = ref('') // e.g. "symbol.asc". Empty means ranked by relevance.
  const page = ref(1) // 1-based, as the API expects.
  const pageSize = ref(DEFAULT_PAGE_SIZE)

  // Response state
  const results = ref<Instrument[]>([])
  const count = ref(0)
  const status = ref<SearchStatus>(SEARCH_STATUS.IDLE)
  const error = ref<string | null>(null)
  const suggestions = ref<Suggestion[]>([])
  const facets = ref<Record<string, FacetCount[]>>({}) // facet key -> counts

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
  const facetControllers: Record<string, AbortController | undefined> = {} // one per facet key

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

  function setSort(orderBy: string) {
    sortBy.value = orderBy
    page.value = 1
    return search()
  }

  function setPage(newPage: number) {
    page.value = newPage
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
      const response = await api.getSuggestions(text, { signal: controller.signal })
      if (!controller.signal.aborted) suggestions.value = response.results
    } catch {
      if (!controller.signal.aborted) suggestions.value = []
    }
  }

  function clearSuggestions() {
    suggestionsController?.abort()
    suggestions.value = []
  }

  async function loadFacet(key: string) {
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
    facets,
    totalPages,
    isEmpty,
    search,
    setQuery,
    setFilter,
    clearFilters,
    setSort,
    setPage,
    loadSuggestions,
    clearSuggestions,
    loadFacet,
  }
})
