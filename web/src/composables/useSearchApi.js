import { buildUrl, request } from './httpClient'

const BASE_URL = '/api'
const SUGGESTION_FIELDS = ['symbol', 'display_name']
const DEFAULT_SUGGESTION_SIZE = 6

function endpoint(path, params) {
  return `${BASE_URL}${buildUrl(path, params)}`
}

export function useSearchApi() {
  /**
   * POST /search. `query` keys are all optional: search_text, kind, is_betashares, order_by, from (1-based), size.
   * `fields` limits which fields come back on each result.
   * @returns {Promise<{ results: object[], count: number, indexed_at: number }>}
   */
  function search(query = {}, { fields, signal } = {}) {
    const url = endpoint('/search', { fields: fields?.join(',') })
    return request(url, { method: 'POST', body: query, signal })
  }

  function getSuggestions(text, { size = DEFAULT_SUGGESTION_SIZE, signal } = {}) {
    return search({ search_text: text, size }, { fields: SUGGESTION_FIELDS, signal })
  }

  /**
   * POST /facets/:key. Filter options with counts, for the given query.
   * @returns {Promise<{ value: string, count: number }[]>}
   */
  function getFacetCounts(key, query = {}, { omitEmptyCounts = false, signal } = {}) {
    const url = endpoint(`/facets/${encodeURIComponent(key)}`, {
      omit_empty_counts: omitEmptyCounts ? 'true' : undefined,
    })
    return request(url, { method: 'POST', body: query, signal })
  }

  function getFacetKeys({ signal } = {}) {
    return request(endpoint('/facets/keys'), { signal })
  }

  /**
   * GET /instruments/:id, for example "A200:AU".
   */
  function getInstrument(symbolOpenfigi, { fields, signal } = {}) {
    const url = endpoint(`/instruments/${encodeURIComponent(symbolOpenfigi)}`, {
      fields: fields?.join(','),
    })
    return request(url, { signal })
  }

  return { search, getSuggestions, getFacetCounts, getFacetKeys, getInstrument }
}
