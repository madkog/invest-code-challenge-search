import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { useSearchApi } from '../composables/useSearchApi'
import { createEmptyFilters, buildFilterQuery } from '../composables/searchFilters'

const DEFAULT_PAGE_SIZE = 15
export const SEARCH_STATUS = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
})

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
  const filters = ref(createEmptyFilters())
  const sortBy = ref('') // e.g. "symbol.asc". Empty means ranked by relevance.
  const page = ref(1) // 1-based, as the API expects.
  const pageSize = ref(DEFAULT_PAGE_SIZE)

  // Response state
  const results = ref([])
  const count = ref(0)
  const status = ref(SEARCH_STATUS.IDLE)
  const error = ref(null)
  const suggestions = ref([])
  const facets = ref({}) // facet key -> [{ value, count }]

  const totalPages = computed(() => Math.ceil(count.value / pageSize.value))
  const isEmpty = computed(
    () => status.value === SEARCH_STATUS.SUCCESS && results.value.length === 0,
  )

  // The text and filters only. Used for facet counts, which ignore sort and page.
  const filterQuery = computed(() => ({
    ...(query.value ? { search_text: query.value } : {}),
    ...buildFilterQuery(filters.value),
  }))

  const searchQuery = computed(() => ({
    ...filterQuery.value,
    ...(sortBy.value ? { order_by: sortBy.value } : {}),
    from: page.value,
    size: pageSize.value,
  }))

  let searchController = null
  let suggestionsController = null
  const facetControllers = {} // one per facet key

  async function search() {
    searchController?.abort()
    const controller = new AbortController()
    searchController = controller

    status.value = SEARCH_STATUS.LOADING
    error.value = null

    try {
      const response = await api.search(searchQuery.value, { signal: controller.signal })
      if (controller.signal.aborted) return
      results.value = response.results
      count.value = response.count
      status.value = SEARCH_STATUS.SUCCESS
    } catch (caught) {
      if (controller.signal.aborted) return
      results.value = []
      count.value = 0
      error.value = caught.message
      status.value = SEARCH_STATUS.ERROR
    }
  }

  // Changing the query, filters or sort starts again from the first page.
  function setQuery(text) {
    query.value = text
    page.value = 1
    return search()
  }

  function setFilter(key, value) {
    filters.value[key] = value
    page.value = 1
    return search()
  }

  function clearFilters() {
    filters.value = createEmptyFilters()
    page.value = 1
    return search()
  }

  function setSort(orderBy) {
    sortBy.value = orderBy
    page.value = 1
    return search()
  }

  function setPage(newPage) {
    page.value = newPage
    return search()
  }

  // A failed suggestion request shows no suggestions instead of an error, because they are optional.
  async function loadSuggestions(text) {
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

  async function loadFacet(key) {
    facetControllers[key]?.abort()
    const controller = new AbortController()
    facetControllers[key] = controller

    try {
      const counts = await api.getFacetCounts(key, filterQuery.value, {
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
