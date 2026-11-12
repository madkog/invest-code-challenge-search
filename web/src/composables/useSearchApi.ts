import type {
  FacetCount,
  Filters,
  Instrument,
  SearchParams,
  SearchResponse,
  Suggestion,
} from '../types/search'
import { buildUrl, request } from '../utils/httpClient'

const BASE_URL = '/api'
const SUGGESTION_FIELDS = ['symbol', 'display_name']
const DEFAULT_SUGGESTION_SIZE = 6
const MULTI_SELECT_FILTERS = ['kind', 'issuer'] as const
const BOOLEAN_FILTERS = ['is_betashares', 'is_flagship_fund'] as const

// The request body of POST /search and POST /facets/:key. Every key is optional.
interface SearchQuery {
  search_text?: string
  kind?: string[]
  issuer?: string[]
  is_betashares?: { value: boolean }
  is_flagship_fund?: { value: boolean }
  order_by?: string
  from?: number
  size?: number
}

interface ApiOptions {
  signal?: AbortSignal
}

interface FieldsOptions extends ApiOptions {
  // Limits which fields come back on each result.
  fields?: string[]
}

// Empty lists, unset (null) booleans and blank values are left out of the body.
function buildFilterQuery(filters: Filters): SearchQuery {
  const query: SearchQuery = {}
  for (const key of MULTI_SELECT_FILTERS) {
    if (filters[key].length > 0) query[key] = filters[key]
  }
  for (const key of BOOLEAN_FILTERS) {
    const value = filters[key]
    if (value !== null) query[key] = { value }
  }
  return query
}

function buildSearchQuery({ text, filters, sort, page, size }: SearchParams): SearchQuery {
  return {
    ...(text ? { search_text: text } : {}),
    ...(filters ? buildFilterQuery(filters) : {}),
    ...(sort ? { order_by: sort } : {}),
    ...(page !== undefined ? { from: page } : {}),
    ...(size !== undefined ? { size } : {}),
  }
}

function endpoint(path: string, params?: Parameters<typeof buildUrl>[1]): string {
  return `${BASE_URL}${buildUrl(path, params)}`
}

/**
 * The only place that knows the search API endpoints and request shapes.
 * Every function returns a promise and accepts an optional AbortSignal.
 */
export function useSearchApi() {
  // POST /search. Every param is optional. `page` is 1-based.
  function search<T = Instrument>(
    params: SearchParams = {},
    { fields, signal }: FieldsOptions = {},
  ): Promise<SearchResponse<T>> {
    const url = endpoint('/search', { fields: fields?.join(',') })
    return request(url, { method: 'POST', body: buildSearchQuery(params), signal })
  }

  function getSuggestions(
    text: string,
    { size = DEFAULT_SUGGESTION_SIZE, signal }: ApiOptions & { size?: number } = {},
  ): Promise<SearchResponse<Suggestion>> {
    return search<Suggestion>({ text, size }, { fields: SUGGESTION_FIELDS, signal })
  }

  // POST /facets/:key. Filter options with counts, for the given text and filters.
  function getFacetCounts(
    key: string,
    params: SearchParams = {},
    { omitEmptyCounts = false, signal }: ApiOptions & { omitEmptyCounts?: boolean } = {},
  ): Promise<FacetCount[]> {
    const url = endpoint(`/facets/${encodeURIComponent(key)}`, {
      omit_empty_counts: omitEmptyCounts ? 'true' : undefined,
    })
    return request(url, { method: 'POST', body: buildSearchQuery(params), signal })
  }

  function getFacetKeys({ signal }: ApiOptions = {}): Promise<string[]> {
    return request(endpoint('/facets/keys'), { signal })
  }

  // GET /instruments/:id, for example "A200:AU".
  function getInstrument(
    symbolOpenfigi: string,
    { fields, signal }: FieldsOptions = {},
  ): Promise<Instrument> {
    const url = endpoint(`/instruments/${encodeURIComponent(symbolOpenfigi)}`, {
      fields: fields?.join(','),
    })
    return request(url, { signal })
  }

  return { search, getSuggestions, getFacetCounts, getFacetKeys, getInstrument }
}
